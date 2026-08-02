// Minimal auth helpers (rr "server-side authz on every mutation").
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// Tables whose rows belong to exactly one user.
type Owned = "notes" | "workspaces";

// Auth + ownership in one step, for the "load a row I own or fail" case.
export async function requireOwn<T extends Owned>(
  ctx: QueryCtx | MutationCtx,
  id: Id<T>,
  label: string,
): Promise<Doc<T>> {
  // Auth first, so an unauthenticated caller gets "Not authenticated", not NOT_FOUND.
  const userId = await requireUser(ctx);
  const row = await ctx.db.get(id);
  // Deliberate: a missing row and someone else's row look identical to the
  // client, so this can't be used as an existence oracle.
  // Cast because TS can't see `userId` on a still-generic Doc<T> — every Owned table has it.
  if (!row || (row as Record<string, unknown>).userId !== userId) {
    throw new ConvexError({ code: "NOT_FOUND", message: `${label} not found.` });
  }
  return row;
}
