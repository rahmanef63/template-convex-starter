// Minimal auth helpers (rr "server-side authz on every mutation").
import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Tidak terautentikasi");
  return userId;
}

export async function optionalUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users"> | null> {
  return await getAuthUserId(ctx);
}
