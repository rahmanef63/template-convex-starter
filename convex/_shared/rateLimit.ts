// Rate limiting that actually holds: the counter lives in a Convex table, so the
// budget is shared by every caller of a function. An in-memory counter in a
// serverless route only limits the one instance that happened to serve the
// request — spin up ten instances and you hand out ten budgets.
import { ConvexError } from "convex/values";
import type { MutationCtx } from "../_generated/server";

// Rows die with their window, so a key nobody touches again must not keep its
// row: credential keys are the caller's own email address (convex/auth.ts), an
// unbounded key space a stranger picks. Sweeping a few expired rows on each
// insert — the one path that grows the table — keeps it the size of the *active*
// key set. More than one per insert so a flood drains itself instead of just
// keeping pace.
const REAP_PER_INSERT = 3;

async function reapExpired(ctx: MutationCtx, now: number): Promise<void> {
  const dead = await ctx.db
    .query("rateLimits")
    .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
    .take(REAP_PER_INSERT);
  for (const row of dead) await ctx.db.delete(row._id);
}

/**
 * Charge one hit against `key` (e.g. `chat:${userId}`), or with `peek` just ask
 * whether the key is already spent.
 * Throws ConvexError({ code: "RATE_LIMITED", message, retryAfterMs }) when over budget.
 *
 * Fixed window: one row per key holds the count and when that count expires, and
 * an expired window resets in place — so the table stays the size of the active
 * key set instead of growing a row per request.
 *
 * `peek: true` reads the same verdict without spending anything. That is what
 * lets a limiter refuse *before* an expensive lookup while still charging only
 * the attempts that failed — otherwise a stranger spends the budget of an
 * address they don't own (see convex/auth.ts).
 *
 * ponytail: a fixed window lets a caller burst up to 2x `max` across a boundary
 * (max at the end of one window, max at the start of the next), and a hot key is
 * a single document, so concurrent hits on it serialize behind OCC retries.
 * Reaping inside the insert path adds a little of that contention to first-hit
 * writes. Good enough for "stop one user burning the API key". Want a sliding
 * window, token bucket, sharded counters, or a cron-driven sweep? Install
 * @convex-dev/rate-limiter rather than growing this file.
 */
export async function rateLimit(
  ctx: MutationCtx,
  key: string,
  opts: { max: number; windowMs: number; peek?: boolean },
): Promise<void> {
  const now = Date.now();
  // Indexed lookup, never a scan — the table is one row per active key.
  const row = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();

  if (row && now < row.expiresAt) {
    if (row.count >= opts.max) {
      // The caller turns retryAfterMs into a `retry-after` header (see app/api/chat/route.ts).
      throw new ConvexError({
        code: "RATE_LIMITED",
        message: "Too many requests — try again shortly.",
        retryAfterMs: row.expiresAt - now,
      });
    }
    if (!opts.peek) await ctx.db.patch(row._id, { count: row.count + 1 });
    return;
  }

  // No live window: nothing to refuse, and a peek must leave it that way.
  if (opts.peek) return;

  const window = { count: 1, expiresAt: now + opts.windowMs };
  if (row) {
    await ctx.db.patch(row._id, window);
    return;
  }
  await ctx.db.insert("rateLimits", { key, ...window });
  await reapExpired(ctx, now);
}
