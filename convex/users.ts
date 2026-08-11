import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { rateLimit } from "./_shared/rateLimit";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

// What the AI route is allowed to spend per user, per window. One knob —
// exported so tests assert against the real number instead of a copy of it.
export const CHAT_BUDGET = { max: 20, windowMs: 60_000 };

// Everything app/api/chat/route.ts needs, in one round trip: verify the caller's
// Convex token AND charge their quota. A mutation, not a query, because the
// limiter writes its counter — which is the point: the budget lives in the DB,
// so it's global instead of per serverless instance.
export const beginChat = mutation({
  args: {},
  handler: async (ctx) => {
    // Not requireUser: "signed out" is a 401 for the route and has to stay
    // distinguishable from the limiter's throw (a 429), so return null instead.
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    await rateLimit(ctx, `chat:${userId}`, CHAT_BUDGET);
    return userId;
  },
});
