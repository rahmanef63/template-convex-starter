// The shared limiter (convex/_shared/rateLimit.ts) and its two callers. A budget
// is only real if it actually refuses the call after the max, so that's what
// these pin — plus the window rolling over, one key never spending another's,
// and expired rows not piling up forever.
//
// The budgets are IMPORTED, never retyped: a config change should move the test
// with it, not turn the deploy red because a number lives in two files.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ConvexError } from "convex/values";
import { api, internal } from "../convex/_generated/api";
// Importing convex/auth.ts also runs its module-scope guard, so a breaking
// @convex-dev/auth bump fails here rather than at deploy time.
import { CREDENTIALS_BUDGET, RESET_BUDGET } from "../convex/auth";
import { CHAT_BUDGET } from "../convex/users";
import { setup, signUp } from "./harness";

// rateLimit reads Date.now() and nothing else, so stubbing it beats fake timers
// (convex-test drives its own promise queue and deadlocks under those).
let now = Date.parse("2026-01-01T00:00:00Z");
beforeEach(() => {
  now = Date.parse("2026-01-01T00:00:00Z");
  vi.spyOn(Date, "now").mockImplementation(() => now);
});
afterEach(() => vi.restoreAllMocks());

// The limiter throws ConvexError({ code: "RATE_LIMITED", retryAfterMs }); assert
// on the payload, since that's what app/api/chat/route.ts branches on.
async function expectRateLimited(p: Promise<unknown>) {
  const err: unknown = await p.then(() => null, (e: unknown) => e);
  expect(err).toBeInstanceOf(ConvexError);
  const { code, retryAfterMs } = (err as ConvexError<{ code: string; retryAfterMs: number }>).data;
  expect(code).toBe("RATE_LIMITED");
  expect(retryAfterMs).toBeGreaterThan(0);
}

test("beginChat returns null for a signed-out caller and charges nothing", async () => {
  const t = setup();
  expect(await t.mutation(api.users.beginChat, {})).toBeNull();
  // No row: a stranger must not be able to fill the table by calling this.
  const rows = await t.run((ctx) => ctx.db.query("rateLimits").collect());
  expect(rows).toHaveLength(0);
});

test("beginChat allows the budget, then refuses, then recovers next window", async () => {
  const t = setup();
  const alice = await signUp(t, "alice@example.com");

  for (let i = 0; i < CHAT_BUDGET.max; i++) {
    expect(await alice.mutation(api.users.beginChat, {})).not.toBeNull();
  }
  await expectRateLimited(alice.mutation(api.users.beginChat, {}));

  now += CHAT_BUDGET.windowMs; // window rolls over — the counter resets in place
  expect(await alice.mutation(api.users.beginChat, {})).not.toBeNull();
  const rows = await t.run((ctx) => ctx.db.query("rateLimits").collect());
  expect(rows).toHaveLength(1); // reset in place, not a row per request
});

test("one user's chat budget is not spent by another's", async () => {
  const t = setup();
  const alice = await signUp(t, "alice@example.com");
  const bob = await signUp(t, "bob@example.com");
  for (let i = 0; i < CHAT_BUDGET.max; i++) await alice.mutation(api.users.beginChat, {});
  await expectRateLimited(alice.mutation(api.users.beginChat, {}));
  expect(await bob.mutation(api.users.beginChat, {})).not.toBeNull(); // own bucket
});

// Rows are keyed by an address the caller typed, so the key space is theirs, not
// ours. Without a sweep, one unauthenticated loop over random addresses grows
// the table forever.
test("expired rows are reaped as new keys arrive", async () => {
  const t = setup();
  const rows = () => t.run((ctx) => ctx.db.query("rateLimits").collect());

  for (let i = 0; i < 6; i++) {
    await t.mutation(internal.auth.chargeCredentials, { email: `junk${i}@example.com` });
  }
  expect(await rows()).toHaveLength(6);

  now += CREDENTIALS_BUDGET.windowMs + 1; // every one of those windows is now dead
  // Each insert sweeps a few expired rows, so a flood drains instead of piling up.
  for (let i = 0; i < 3; i++) {
    await t.mutation(internal.auth.chargeCredentials, { email: `later${i}@example.com` });
  }
  const left = await rows();
  expect(left.length).toBeLessThan(6 + 3); // dead rows went…
  expect(left.filter((r) => r.expiresAt > now)).toHaveLength(3); // …and only dead ones
});

test("a peek reports the verdict without spending the budget", async () => {
  const t = setup();
  const peek = () =>
    t.mutation(internal.auth.throttleCredentials, { email: "alice@example.com", flow: "signIn" });

  // A correct password peeks and never charges — otherwise anyone who knows your
  // address could lock you out by burning the bucket with junk passwords.
  for (let i = 0; i < CREDENTIALS_BUDGET.max * 2; i++) await peek();
  expect(await t.run((ctx) => ctx.db.query("rateLimits").collect())).toHaveLength(0);
});

test("failed credential attempts are throttled per address, case-insensitively", async () => {
  const t = setup();
  for (let i = 0; i < CREDENTIALS_BUDGET.max; i++) {
    await t.mutation(internal.auth.chargeCredentials, { email: "alice@example.com" });
  }
  // Same address in different case shares the bucket — it's the same account.
  await expectRateLimited(
    t.mutation(internal.auth.throttleCredentials, { email: "ALICE@Example.com ", flow: "signIn" }),
  );
  // A different address is untouched.
  await t.mutation(internal.auth.throttleCredentials, { email: "bob@example.com", flow: "signIn" });
});

test("reset requests spend their own budget, not the sign-in one", async () => {
  const t = setup();
  for (let i = 0; i < RESET_BUDGET.max; i++) {
    await t.mutation(internal.auth.throttleCredentials, {
      email: "alice@example.com",
      flow: "reset",
    });
  }
  // The 4th reset is refused even though the 10-attempt credentials budget is untouched.
  await expectRateLimited(
    t.mutation(internal.auth.throttleCredentials, { email: "alice@example.com", flow: "reset" }),
  );
});

test("a burned sign-in bucket never blocks password recovery", async () => {
  const t = setup();
  // An attacker floods the victim's sign-in bucket with junk passwords…
  for (let i = 0; i < CREDENTIALS_BUDGET.max; i++) {
    await t.mutation(internal.auth.chargeCredentials, { email: "victim@example.com" });
  }
  await expectRateLimited(
    t.mutation(internal.auth.throttleCredentials, { email: "victim@example.com", flow: "signIn" }),
  );
  // …and the victim can still ask for a reset code. Separate key, separate budget.
  await t.mutation(internal.auth.throttleCredentials, {
    email: "victim@example.com",
    flow: "reset",
  });
});
