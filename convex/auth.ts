import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, type ActionCtx } from "./_generated/server";
import { rateLimit } from "./_shared/rateLimit";
import { mailConfigured, sendEmail } from "./_shared/email";

// A reset code is a password in disguise — keep the window short so a mailbox
// someone read once isn't a standing key to the account.
const RESET_CODE_TTL_S = 15 * 60;

// One budget per address for every failed credential attempt: sign-in, sign-up,
// reset verification. Loose enough that a legitimate mistyped password never
// bites, tight enough that guessing is pointless. Exported so tests assert
// against the real numbers instead of a copy of them.
export const CREDENTIALS_BUDGET = { max: 10, windowMs: 10 * 60_000 };
// A separate, tighter one for the reset request — the only flow that makes *us*
// send mail to an address the caller doesn't have to own (a mail-bomb vector).
// Separate on purpose: a flooded sign-in bucket must never block recovery.
export const RESET_BUDGET = { max: 3, windowMs: 15 * 60_000 };

// Lowercased so case variants of one address share a bucket, and bounded
// because it becomes a stored key (RFC 5321 caps an address at 254 chars).
const bucket = (email: string) => email.trim().toLowerCase().slice(0, 254);

// Pre-flight, before any account lookup or password work — the provider's
// `authorize` hook is the only caller, never a client. Internal mutations, not
// helpers, because the counter is a row (convex/_shared/rateLimit.ts) while
// `authorize` runs in an action — and a row is why the budget is global.
//
// Sign-in only *peeks* here: charging every attempt, successes included, hands
// anyone who knows your address a lockout button (ten junk passwords a minute
// and your correct one stops working). A reset request has no failure to charge
// against — it always answers the same thing — so it pays up front, and only on
// its own key.
export const throttleCredentials = internalMutation({
  args: { email: v.string(), flow: v.string() },
  handler: async (ctx, args) => {
    const key = bucket(args.email);
    if (args.flow === "reset") {
      await rateLimit(ctx, `reset:${key}`, RESET_BUDGET);
      return;
    }
    await rateLimit(ctx, `credentials:${key}`, { ...CREDENTIALS_BUDGET, peek: true });
  },
});

// The other half: only a *failed* attempt costs the address its budget.
export const chargeCredentials = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    try {
      await rateLimit(ctx, `credentials:${bucket(args.email)}`, CREDENTIALS_BUDGET);
    } catch {
      // The peek above owns refusing; this call only records. Swallowing its
      // throw stops a concurrent 11th failure from replacing "wrong password"
      // with "rate limited" — the count is already at max either way.
    }
  },
});

// Password reset, optional by design: without RESEND_API_KEY / AUTH_EMAIL_FROM
// on the Convex deployment the flow reports itself unconfigured (see the
// authorize wrapper below) and the rest of the template still runs. `Email()`
// binds the code to the address it was mailed to, so a guessed code is useless
// without the matching email.
const resetEmail = Email({
  id: "password-reset",
  maxAge: RESET_CODE_TTL_S,
  async sendVerificationRequest({ identifier, token }) {
    await sendEmail({
      to: identifier,
      subject: "Your password reset code",
      // `token` is the secret. It goes in the mail and nowhere else — never a log.
      text:
        `Paste this code into the app to choose a new password:\n\n${token}\n\n` +
        `It expires in ${RESET_CODE_TTL_S / 60} minutes and can only be used once. ` +
        `If you didn't ask for this, ignore this email — nothing has changed.`,
    });
  },
});

const password = Password({
  reset: resetEmail,
  profile(params) {
    const email = params.email as string;
    return { email, name: (params.name as string | undefined) || email };
  },
});

// Throttle every credential attempt *before* any account lookup or password
// work. The provider's own `authorize` is the only hook that runs that early
// (`profile` is typed sync, so it can't touch the DB), so we wrap it.
//
// ponytail: reaches into ConvexCredentials' internal `.options`, where the real
// handler lives — the top-level `authorize` is an `async () => null` stub that
// materialization overwrites via `merge(provider, provider.options)`
// (@convex-dev/auth src/server/provider_utils.ts). This delegates to the
// library's handler rather than forking Password.ts, so sign-in logic stays
// theirs. It fails loud at push time if the shape ever changes instead of
// silently dropping the limit; the upgrade path is to reimplement the provider
// with ConvexCredentials + lucia's Scrypt (add `lucia` to package.json first).
type Authorize = (params: Record<string, unknown>, ctx: ActionCtx) => Promise<unknown>;
const credentials = password as unknown as { options?: { authorize?: Authorize } };
const inner = credentials.options?.authorize;
if (typeof inner !== "function") {
  throw new Error(
    "@convex-dev/auth changed shape: the Password provider's authorize hook is no " +
      "longer at `.options.authorize`, so sign-in rate limiting is not wired. " +
      "Fix convex/auth.ts before deploying.",
  );
}
credentials.options!.authorize = async (params, ctx) => {
  // Attempts with no email share one bucket; they can never succeed anyway.
  const email = typeof params.email === "string" ? params.email : "";
  const flow = typeof params.flow === "string" ? params.flow : "";
  // A reset request must answer the same thing for every address, or the login
  // form is an email-enumeration oracle: the library fails with a plain Error
  // for an unknown account but reaches the mailer for a real one, so the two
  // differ by error *class* — which no client-side check can smooth over.
  if (flow === "reset") {
    // Asked before anything is looked up or recorded: "not configured" is a
    // property of the deployment (the default state of a fresh clone), so it's
    // the same answer for every address and worth saying out loud.
    if (!mailConfigured()) {
      throw new ConvexError({
        code: "NOT_CONFIGURED",
        message: "Password reset is not configured.",
      });
    }
    await ctx.runMutation(internal.auth.throttleCredentials, { email, flow });
    try {
      return await inner(params, ctx);
    } catch (err) {
      // Unknown account, Resend down, SITE_URL missing — all collapse to `null`,
      // which is exactly what a *successful* reset returns (implementation/
      // signIn.js → handleCredentials → `{ signedIn: null }` → `{ tokens: null }`),
      // so the two are indistinguishable. The developer still sees this — in the
      // Convex logs, where it belongs.
      console.error("[auth] password reset request failed", err);
      return null;
    }
  }

  await ctx.runMutation(internal.auth.throttleCredentials, { email, flow });
  try {
    return await inner(params, ctx);
  } catch (err) {
    // Only a failure costs the address its budget — see throttleCredentials.
    await ctx.runMutation(internal.auth.chargeCredentials, { email });
    throw err;
  }
};

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) return args.existingUserId;
      const email = args.profile.email as string | undefined;
      if (email) {
        const existing = await ctx.db
          .query("users")
          // authTables ships a built-in "email" index, but the callback's ctx
          // isn't typed with the app DataModel (still true at auth 0.0.94), so
          // the index arg + q are cast. Runtime is correct.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .withIndex("email" as never, (q: any) => q.eq("email", email))
          .first();
        if (existing) return existing._id;
      }
      return ctx.db.insert("users", { email, name: (args.profile.name as string | undefined) ?? email });
    },
  },
});
