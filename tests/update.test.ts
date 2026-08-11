// The in-app update channel (convex/update.ts). The rebuild button spends real
// build minutes on a template with OPEN signup, so "signed in" is not "allowed":
// these pin the auth gate, the owner restriction, and the global cap.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ConvexError } from "convex/values";
import { internal } from "../convex/_generated/api";
import { setup, signUp } from "./harness";

// Same approach as tests/rate-limit.test.ts: the limiter reads Date.now() and
// nothing else, so stubbing it beats fake timers (convex-test deadlocks there).
let now = Date.parse("2026-01-01T00:00:00Z");
beforeEach(() => {
  now = Date.parse("2026-01-01T00:00:00Z");
  vi.spyOn(Date, "now").mockImplementation(() => now);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

test("rebuild is refused for a signed-out caller", async () => {
  const t = setup();
  await expect(t.mutation(internal.update.guardRebuild, {})).rejects.toThrow(/Not authenticated/);
  await expect(t.mutation(internal.update.requireViewer, {})).rejects.toThrow(/Not authenticated/);
});

test("a signed-in user may rebuild while OWNER_EMAIL is unset", async () => {
  const t = setup();
  const user = await signUp(t, "someone@example.com");
  await expect(user.mutation(internal.update.guardRebuild, {})).resolves.toBeNull();
});

test("only the owner may rebuild once OWNER_EMAIL is set", async () => {
  vi.stubEnv("OWNER_EMAIL", "Owner@Example.com "); // case + whitespace must not matter
  const t = setup();
  const stranger = await signUp(t, "stranger@example.com");
  await expect(stranger.mutation(internal.update.guardRebuild, {})).rejects.toThrow(ConvexError);

  const owner = await signUp(t, "owner@example.com");
  await expect(owner.mutation(internal.update.guardRebuild, {})).resolves.toBeNull();
});

test("the rebuild budget is global — a second account can't reset it", async () => {
  const t = setup();
  const a = await signUp(t, "a@example.com");
  const b = await signUp(t, "b@example.com");

  // 3 per hour, shared. Spend it from one account…
  for (let i = 0; i < 3; i++) await a.mutation(internal.update.guardRebuild, {});
  // …and the other is refused too: the key is the deployment, not the caller.
  await expect(b.mutation(internal.update.guardRebuild, {})).rejects.toThrow(ConvexError);

  // The window rolls over.
  now += 60 * 60_000 + 1;
  await expect(b.mutation(internal.update.guardRebuild, {})).resolves.toBeNull();
});
