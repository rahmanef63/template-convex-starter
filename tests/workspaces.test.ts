// Backend tests for the workspaces feature — auth required, per-user isolation,
// and idempotent seeding. Same harness as tests/notes.test.ts.
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

const modules = import.meta.glob(["../convex/**/*.{js,ts}", "!../convex/**/*.d.ts"]);

function setup() {
  return convexTest(schema, modules);
}

async function signUp(t: ReturnType<typeof setup>, email: string) {
  const userId = await t.run(async (ctx) => ctx.db.insert("users", { email }));
  return t.withIdentity({ subject: `${userId}|test-session` });
}

const SEED = [
  {
    name: "Acme",
    plan: "Pro",
    icon: "sparkle",
    features: [{ slug: "f1", label: "Feature 1", sub: "", icon: "home", group: "project" as const }],
  },
  { name: "Beta", plan: "Free", icon: "folder", features: [] },
];

test("list + ensureSeeded reject unauthenticated callers", async () => {
  const t = setup();
  await expect(t.query(api.workspaces.list, {})).rejects.toThrow("Not authenticated");
  await expect(
    t.mutation(api.workspaces.ensureSeeded, { workspaces: SEED }),
  ).rejects.toThrow("Not authenticated");
});

test("ensureSeeded seeds once, preserves order, and is idempotent", async () => {
  const t = setup();
  const alice = await signUp(t, "alice@example.com");
  await alice.mutation(api.workspaces.ensureSeeded, { workspaces: SEED });
  await alice.mutation(api.workspaces.ensureSeeded, { workspaces: SEED }); // no-op the second time
  const list = await alice.query(api.workspaces.list, {});
  expect(list.map((w) => w.name)).toEqual(["Acme", "Beta"]); // seeded once, order kept
});

test("workspaces are isolated per user", async () => {
  const t = setup();
  const alice = await signUp(t, "alice@example.com");
  const bob = await signUp(t, "bob@example.com");
  await alice.mutation(api.workspaces.ensureSeeded, { workspaces: SEED });
  expect((await alice.query(api.workspaces.list, {})).length).toBe(2);
  expect((await bob.query(api.workspaces.list, {})).length).toBe(0); // bob can't see alice's
});

test("create adds a workspace and returns its id", async () => {
  const t = setup();
  const alice = await signUp(t, "alice@example.com");
  const id = await alice.mutation(api.workspaces.create, { name: "Fresh" });
  const list = await alice.query(api.workspaces.list, {});
  expect(list.find((w) => w._id === id)?.name).toBe("Fresh");
});

test("only the owner can rename or delete a workspace", async () => {
  const t = setup();
  const alice = await signUp(t, "alice@example.com");
  const bob = await signUp(t, "bob@example.com");
  await alice.mutation(api.workspaces.ensureSeeded, { workspaces: SEED }); // alice has 2
  const [ws] = await alice.query(api.workspaces.list, {});
  await expect(bob.mutation(api.workspaces.rename, { id: ws._id, name: "Hacked" })).rejects.toThrow();
  await expect(bob.mutation(api.workspaces.remove, { id: ws._id })).rejects.toThrow();
  await alice.mutation(api.workspaces.rename, { id: ws._id, name: "Renamed" });
  expect((await alice.query(api.workspaces.list, {})).some((w) => w.name === "Renamed")).toBe(true);
});

test("cannot delete the last workspace", async () => {
  const t = setup();
  const alice = await signUp(t, "alice@example.com");
  const only = await alice.mutation(api.workspaces.create, { name: "Only" });
  await expect(alice.mutation(api.workspaces.remove, { id: only })).rejects.toThrow();
  await alice.mutation(api.workspaces.create, { name: "Second" }); // now two — delete works
  await alice.mutation(api.workspaces.remove, { id: only });
  expect((await alice.query(api.workspaces.list, {})).map((w) => w.name)).toEqual(["Second"]);
});
