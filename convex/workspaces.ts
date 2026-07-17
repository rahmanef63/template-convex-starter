import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./_shared/auth";

// One feature (a menu entry) inside a workspace. Same shape as the frontend's
// MenuItem — validated here because it arrives from the client during seeding.
const featureValidator = v.object({
  slug: v.string(),
  label: v.string(),
  sub: v.string(),
  icon: v.string(),
  group: v.union(v.literal("project"), v.literal("system")),
});

// The signed-in user's workspaces, sorted by `order`. Indexed read — never a scan.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});

// Seed a brand-new user's workspaces once, from the client-supplied defaults
// (the in-code placeholder set). Idempotent: a no-op if the user already has any,
// so it's safe to call on every mount. Bounded so a crafted client can't flood.
export const ensureSeeded = mutation({
  args: {
    workspaces: v.array(
      v.object({
        name: v.string(),
        plan: v.string(),
        icon: v.string(),
        features: v.array(featureValidator),
      }),
    ),
  },
  handler: async (ctx, { workspaces }) => {
    const userId = await requireUser(ctx);
    if (workspaces.length > 12) {
      throw new ConvexError({ code: "TOO_MANY", message: "Too many workspaces to seed." });
    }
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) return; // already seeded — idempotent

    let order = 0;
    for (const w of workspaces) {
      await ctx.db.insert("workspaces", {
        userId,
        name: w.name.trim().slice(0, 60) || "Workspace",
        plan: w.plan.trim().slice(0, 40),
        icon: w.icon.slice(0, 40),
        order: order++,
        features: w.features.slice(0, 40),
      });
    }
  },
});
