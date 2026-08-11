import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";

// The single knob for the AI tier. Swap for the model that fits your feature:
//   claude-opus-4-8  — hardest reasoning (priciest)
//   claude-sonnet-5  — best speed/quality balance (default, great for chat)
//   claude-haiku-4-5 — cheap + fast, simple tasks
const MODEL = "claude-sonnet-5";

export const maxDuration = 30;

// A per-minute request count is not a spend limit: the client picks the history
// it sends and the model picks how much it writes back, so 20 requests can still
// be 20 × a multi-megabyte prompt. These bound the *work* each request may buy.
// ~32 KB of JSON is a long conversation and a small bill; raise it knowingly.
const MAX_REQUEST_CHARS = 32_000;
const MAX_OUTPUT_TOKENS = 2_000;

// Only signed-in users may spend the API key. The client sends its Convex auth
// JWT (see components/os/assistant-screen.tsx) and one authed mutation does both
// jobs: it verifies the token (invalid/expired ones fail) and charges the
// caller's quota, whose counter lives in a Convex table — so the limit is global
// across instances, not one budget per warm serverless instance.
// Returns the response to send back when the caller can't proceed, else null.
async function denied(req: Request): Promise<Response | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (token && convexUrl) {
    const convex = new ConvexHttpClient(convexUrl);
    convex.setAuth(token);
    try {
      if (await convex.mutation(api.users.beginChat, {})) return null;
    } catch (err) {
      const ms = retryAfterMs(err);
      if (ms !== null) {
        return new Response("Too many messages — wait a minute and try again.", {
          status: 429,
          headers: { "retry-after": String(Math.max(1, Math.ceil(ms / 1000))) },
        });
      }
      // Anything else (expired token, Convex unreachable) reads as signed out.
    }
  }
  return new Response("Sign in to use the assistant.", { status: 401 });
}

// convex/_shared/rateLimit.ts throws ConvexError({ code: "RATE_LIMITED", retryAfterMs }).
function retryAfterMs(err: unknown): number | null {
  if (!(err instanceof ConvexError)) return null;
  const data = err.data as { code?: string; retryAfterMs?: number };
  return data?.code === "RATE_LIMITED" ? (data.retryAfterMs ?? 0) : null;
}

export async function POST(req: Request) {
  // The assistant is OPTIONAL — the app runs fine without a key. This route
  // stays offline until you set ANTHROPIC_API_KEY (@ai-sdk/anthropic reads it
  // from the environment automatically).
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      "Assistant offline — set ANTHROPIC_API_KEY in your env to enable it.",
      { status: 503 },
    );
  }

  const refusal = await denied(req);
  if (refusal) return refusal;

  const { messages }: { messages: UIMessage[] } = await req.json();
  // Before a single token is spent: the history is client-supplied and goes to
  // the model verbatim, so an oversized one is refused rather than billed.
  if (JSON.stringify(messages).length > MAX_REQUEST_CHARS) {
    return new Response("This conversation is too long — start a new one.", { status: 413 });
  }
  const result = streamText({
    model: anthropic(MODEL),
    system:
      "You are a concise, helpful assistant embedded in a Convex + Next.js starter app. Answer directly.",
    messages: await convertToModelMessages(messages),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });
  return result.toUIMessageStreamResponse();
}
