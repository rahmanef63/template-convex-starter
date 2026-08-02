// Shared test harness — every backend suite boots the same way.
import { convexTest } from "convex-test";
import schema from "../convex/schema";

// Paths are relative to this file; harness.ts sits in tests/ alongside the suites.
const modules = import.meta.glob(["../convex/**/*.{js,ts}", "!../convex/**/*.d.ts"]);

export function setup() {
  return convexTest(schema, modules);
}

// @convex-dev/auth encodes identities as "<userId>|<sessionId>" in the JWT
// subject; getAuthUserId reads the part before the divider.
export async function signUp(t: ReturnType<typeof setup>, email: string) {
  const userId = await t.run(async (ctx) => ctx.db.insert("users", { email }));
  return t.withIdentity({ subject: `${userId}|test-session` });
}
