import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./_shared/auth";

// Every note belongs to exactly one user. Reads use the by_user index (never a
// full scan) and every mutation re-checks ownership before touching a row.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const userId = await requireUser(ctx);
    const clean = text.trim().slice(0, 500);
    if (!clean) throw new ConvexError("Note cannot be empty.");
    return ctx.db.insert("notes", { userId, text: clean, done: false });
  },
});

export const toggle = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const note = await ctx.db.get(id);
    if (!note || note.userId !== userId) throw new ConvexError("Note not found.");
    await ctx.db.patch(id, { done: !note.done });
  },
});

export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const note = await ctx.db.get(id);
    if (!note || note.userId !== userId) throw new ConvexError("Note not found.");
    await ctx.db.delete(id);
  },
});
