import { v, ConvexError } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireOwn, requireUser } from "./_shared/auth";

// The one way to read a user's workspaces: indexed, never a scan.
const byUser = (ctx: QueryCtx, userId: Id<"users">) =>
  ctx.db.query("workspaces").withIndex("by_user", (q) => q.eq("userId", userId));

// A read has to be bounded, always — same rule as convex/notes.ts. This one
// doubles as the cap on `create`, so the table can't grow past what a read can
// return and the switcher never silently hides a workspace you own.
export const MAX_WORKSPACES = 50;

// One feature (a menu entry) inside a workspace. Same shape as the frontend's
// MenuItem — validated here because it arrives from the client during seeding.
const featureValidator = v.object({
  slug: v.string(),
  label: v.string(),
  sub: v.string(),
  icon: v.string(),
  group: v.union(v.literal("project"), v.literal("system")),
});

// The signed-in user's workspaces, sorted by `order`.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    // .take(), never .collect(): `create` caps the count at MAX_WORKSPACES, so
    // this returns everything the user owns without an unbounded read.
    const rows = await byUser(ctx, userId).take(MAX_WORKSPACES);
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
    const existing = await byUser(ctx, userId).first();
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

// Create a new workspace for the caller (the switcher's "Add workspace"). Starts
// with the real notes feature so it isn't empty; returns the new id so the UI can
// switch to it. order = max + 1 keeps it last.
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await requireUser(ctx);
    const clean = name.trim().slice(0, 60) || "New workspace";
    const rows = await byUser(ctx, userId).take(MAX_WORKSPACES);
    // Bounded on write too, or a scripted client grows the row past what `list`
    // can read back and the extras become invisible-but-billed.
    if (rows.length >= MAX_WORKSPACES) {
      throw new ConvexError({ code: "TOO_MANY", message: "Workspace limit reached." });
    }
    const order = rows.reduce((max, w) => Math.max(max, w.order), -1) + 1;
    return await ctx.db.insert("workspaces", {
      userId,
      name: clean,
      plan: "Free",
      icon: "sparkle",
      order,
      features: [
        { slug: "notes", label: "Notes", sub: "Your notes — a real Convex feature", icon: "doc", group: "project" },
        { slug: "settings", label: "Settings", sub: "Workspace configuration", icon: "gear", group: "system" },
      ],
    });
  },
});

export const rename = mutation({
  args: { id: v.id("workspaces"), name: v.string() },
  handler: async (ctx, { id, name }) => {
    await requireOwn(ctx, id, "Workspace");
    const clean = name.trim().slice(0, 60);
    if (!clean) throw new ConvexError({ code: "EMPTY", message: "Name can't be empty." });
    await ctx.db.patch(id, { name: clean });
  },
});

export const remove = mutation({
  args: { id: v.id("workspaces") },
  handler: async (ctx, { id }) => {
    const ws = await requireOwn(ctx, id, "Workspace");
    const rows = await byUser(ctx, ws.userId).take(2);
    if (rows.length <= 1) {
      throw new ConvexError({ code: "LAST", message: "You need at least one workspace." });
    }
    await ctx.db.delete(id);
  },
});
