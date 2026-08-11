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
  // Fixed-window counters for convex/_shared/rateLimit.ts — one row per key
  // (`chat:<userId>`, `credentials:<email>`, …), reset in place when the window
  // rolls over. In the DB so the budget is global, not per serverless instance.
  // `expiresAt` (not a start + a length) is the whole window: it says when the
  // count dies, which is both the retry-after the caller reports and the only
  // thing the reaper needs — hence by_expiry, so rows keyed by an address a
  // stranger chose can be swept instead of accumulating forever.
  rateLimits: defineTable({
    key: v.string(),
    count: v.number(),
    expiresAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_expiry", ["expiresAt"]),
});
