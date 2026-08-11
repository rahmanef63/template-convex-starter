import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwn, requireUser } from "./_shared/auth";

// Every note belongs to exactly one user. Reads use the by_user index (never a
// full scan) and every mutation re-checks ownership before touching a row.

// A read has to be bounded, always: .collect() fetches every row the user owns,
// which grows forever and eventually trips Convex's per-query read limit.
export const MAX_NOTES = 200;

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    // ponytail: newest MAX_NOTES, no pager — the screen shows one list. When a
    // user can realistically pass that, swap .take() for .paginate(paginationOpts)
    // (args: { paginationOpts: paginationOptsValidator }) + usePaginatedQuery.
    return ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_NOTES);
  },
});

export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const userId = await requireUser(ctx);
    const clean = text.trim().slice(0, 500);
    if (!clean) throw new ConvexError({ code: "EMPTY", message: "Note cannot be empty." });
    return ctx.db.insert("notes", { userId, text: clean, done: false });
  },
});

export const toggle = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, { id }) => {
    const note = await requireOwn(ctx, id, "Note");
    await ctx.db.patch(id, { done: !note.done });
  },
});

export const remove = mutation({
  args: { id: v.id("notes") },
  handler: async (ctx, { id }) => {
    await requireOwn(ctx, id, "Note");
    await ctx.db.delete(id);
  },
});
