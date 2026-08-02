// Exemplar backend tests — the pattern to copy for every new feature: prove
// that mutations require auth and that ownership checks hold across users.
// Tests live in tests/ (outside convex/) so deploys never bundle them.
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../convex/_generated/api";
import schema from "../convex/schema";

const modules = import.meta.glob(["../convex/**/*.{js,ts}", "!../convex/**/*.d.ts"]);

function setup() {
  return convexTest(schema, modules);
}

// @convex-dev/auth encodes identities as "<userId>|<sessionId>" in the JWT
// subject; getAuthUserId reads the part before the divider.
async function signUp(t: ReturnType<typeof setup>, email: string) {
  const userId = await t.run(async (ctx) => ctx.db.insert("users", { email }));
  return t.withIdentity({ subject: `${userId}|test-session` });
}

test("queries and mutations reject unauthenticated callers", async () => {
  const t = setup();
  await expect(t.query(api.notes.list, {})).rejects.toThrow("Not authenticated");
  await expect(t.mutation(api.notes.add, { text: "hi" })).rejects.toThrow(
    "Not authenticated",
  );
});

test("notes are isolated per user", async () => {
  const t = setup();
  const alice = await signUp(t, "alice@example.com");
  const bob = await signUp(t, "bob@example.com");

  await alice.mutation(api.notes.add, { text: "alice 1" });
  await alice.mutation(api.notes.add, { text: "alice 2" });
  await bob.mutation(api.notes.add, { text: "bob 1" });

  const aliceNotes = await alice.query(api.notes.list, {});
  const bobNotes = await bob.query(api.notes.list, {});
  expect(aliceNotes.map((n) => n.text).sort()).toEqual(["alice 1", "alice 2"]);
  expect(bobNotes.map((n) => n.text)).toEqual(["bob 1"]);
});

test("only the owner can toggle or remove a note", async () => {
  const t = setup();
  const alice = await signUp(t, "alice@example.com");
  const bob = await signUp(t, "bob@example.com");

  const noteId = await alice.mutation(api.notes.add, { text: "mine" });

  await expect(bob.mutation(api.notes.toggle, { id: noteId })).rejects.toThrow();
  await expect(bob.mutation(api.notes.remove, { id: noteId })).rejects.toThrow();

  await alice.mutation(api.notes.toggle, { id: noteId });
  const [note] = await alice.query(api.notes.list, {});
  expect(note.done).toBe(true);
});

test("add trims input, rejects empty text, and bounds length", async () => {
  const t = setup();
  const alice = await signUp(t, "alice@example.com");

  await expect(alice.mutation(api.notes.add, { text: "   " })).rejects.toThrow();

  await alice.mutation(api.notes.add, { text: `  padded ${"x".repeat(600)}` });
  const [note] = await alice.query(api.notes.list, {});
  expect(note.text.startsWith("padded")).toBe(true);
  expect(note.text.length).toBe(500);
});
