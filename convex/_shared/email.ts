// Transactional email over the Resend HTTP API — plain `fetch`, no SDK and no
// new dependency. Both env vars live on the CONVEX deployment
// (`bunx convex env set RESEND_API_KEY ...`), not in Vercel: this runs inside a
// Convex action, which never sees the Next.js process environment.
import { ConvexError } from "convex/values";

/**
 * Is mail configured on this deployment? Callers ask *before* doing anything
 * address-specific: "not configured" is a property of the deployment, so it is
 * the same answer for every address and safe to show. Discovering it halfway
 * through a flow makes the failure depend on whose address it was.
 */
export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM);
}

/**
 * Send one email.
 *
 * Optional by design: with `RESEND_API_KEY` / `AUTH_EMAIL_FROM` unset the
 * template still runs and the one feature that needs mail (password reset, the
 * only caller) reports itself as unconfigured — the same posture as
 * `ANTHROPIC_API_KEY` for the assistant.
 *
 * Neither the key nor the body is ever logged: the body carries a reset code.
 */
export async function sendEmail(args: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  // Belt and braces: callers are expected to have asked mailConfigured() first.
  if (!apiKey || !from) {
    throw new ConvexError({
      code: "NOT_CONFIGURED",
      message: "Password reset is not configured.",
    });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from, to: args.to, subject: args.subject, text: args.text }),
  });

  // Resend echoes the offending request back in its error body — don't forward
  // it to the client and don't log it, it quotes the recipient and the payload.
  if (!res.ok) {
    throw new ConvexError({
      code: "EMAIL_FAILED",
      message: "Could not send the email. Try again in a minute.",
    });
  }
}
