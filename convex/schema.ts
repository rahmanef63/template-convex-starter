import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  notes: defineTable({
    userId: v.id("users"),
    text: v.string(),
    done: v.boolean(),
  }).index("by_user", ["userId"]),
  // A workspace owns its own menu (its `features`). Per-user; the OS shell reads
  // the signed-in user's workspaces via workspaces.list and the switcher picks
  // among them. `order` gives a stable sort.
  workspaces: defineTable({
    userId: v.id("users"),
    name: v.string(),
    plan: v.string(),
    icon: v.string(),
    order: v.number(),
    features: v.array(
      v.object({
        slug: v.string(),
        label: v.string(),
        sub: v.string(),
        icon: v.string(),
        group: v.union(v.literal("project"), v.literal("system")),
      }),
    ),
  }).index("by_user", ["userId"]),
});
