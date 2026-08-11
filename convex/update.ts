import { ConvexError } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser } from "./_shared/auth";
import { rateLimit } from "./_shared/rateLimit";

// The in-app update channel (fleet contract — see _templates/UPDATE-FLOW.md).
//
// A deployed clone can't `git pull` itself. What it CAN do is tell its owner
// that the template shipped a newer version, and — if they pasted a Vercel
// deploy hook into the Convex env — rebuild on demand. Pulling the new *code*
// is a git operation the owner runs: `bun run update:template`.

// Upstream manifest, on the template's default branch. Hardcoded on purpose:
// a client-supplied URL would turn this action into an SSRF gadget.
const UPSTREAM_VERSION_URL =
  "https://raw.githubusercontent.com/rahmanef63/template-convex-starter/main/version.json";

// Rebuilds are expensive (build minutes) and this template ships OPEN SIGNUP —
// so "signed in" is not "allowed". One global budget, not per-user: the point is
// to cap total builds, and a stranger can always make another account.
const REBUILD_BUDGET = { max: 3, windowMs: 60 * 60_000 };

export const latestVersion = action({
  args: {},
  handler: async (ctx): Promise<{ version: string; core: string; channel: string } | null> => {
    // Signed-in only — this is an owner-facing check, and it spends an outbound
    // request per call.
    await ctx.runMutation(internal.update.requireViewer, {});
    try {
      const res = await fetch(UPSTREAM_VERSION_URL, { cache: "no-store" });
      if (!res.ok) return null;
      const json = (await res.json()) as { version?: string; core?: string; channel?: string };
      if (!json?.version) return null;
      return {
        version: json.version,
        core: json.core ?? json.version,
        channel: json.channel ?? "stable",
      };
    } catch {
      // Upstream unreachable is not an app error — the card just says "unknown".
      return null;
    }
  },
});

export const requireViewer = internalMutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
  },
});

// Auth + ownership + budget, all before a single build minute is spent. A
// mutation because the limiter's counter is a row; the action can't write.
export const guardRebuild = internalMutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    // OWNER_EMAIL is optional: unset, any signed-in user may rebuild (still
    // capped by the global budget). Set it on the Convex deployment the moment
    // your site is public — open signup means "signed in" includes strangers.
    const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
    if (owner) {
      const user = await ctx.db.get(userId);
      if (user?.email?.trim().toLowerCase() !== owner) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Only the site owner can trigger a rebuild.",
        });
      }
    }
    await rateLimit(ctx, "rebuild:global", REBUILD_BUDGET);
  },
});

type RebuildResult = { ok: boolean; reason: "triggered" | "no-hook" | "hook-failed" };

export const rebuild = action({
  args: {},
  handler: async (ctx): Promise<RebuildResult> => {
    await ctx.runMutation(internal.update.guardRebuild, {});
    const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (!hook) return { ok: false, reason: "no-hook" };
    // The hook is owner-set, but it is still an outbound POST from our backend:
    // refuse anything that isn't actually a Vercel deploy hook.
    let url: URL;
    try {
      url = new URL(hook);
    } catch {
      return { ok: false, reason: "no-hook" };
    }
    if (url.protocol !== "https:" || !url.hostname.endsWith("vercel.com")) {
      return { ok: false, reason: "no-hook" };
    }
    try {
      const res = await fetch(url, { method: "POST" });
      return { ok: res.ok, reason: res.ok ? "triggered" : "hook-failed" };
    } catch {
      // Never surface the error — the hook URL is a secret and can appear in it.
      return { ok: false, reason: "hook-failed" };
    }
  },
});
