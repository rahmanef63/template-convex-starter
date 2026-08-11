import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// The single knob for the AI tier. Swap for the model that fits your feature:
//   claude-opus-4-8  — hardest reasoning (priciest)
//   claude-sonnet-5  — best speed/quality balance (default, great for chat)
//   claude-haiku-4-5 — cheap + fast, simple tasks
const MODEL = "claude-sonnet-5";

export const maxDuration = 30;

// Only signed-in users may spend the API key. The client sends its Convex auth
// JWT (see components/os/assistant-screen.tsx); we verify it by asking Convex
// who the caller is — invalid/expired tokens fail the query. Returns the caller
// id (also the rate-limit key) or null.
async function callerId(req: Request): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !process.env.NEXT_PUBLIC_CONVEX_URL) return null;
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  convex.setAuth(token);
  try {
    const user = await convex.query(api.users.me, {});
    return user?._id ?? null;
  } catch {
    return null;
  }
}

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

// ponytail: in-memory sliding window, per function instance — a signed-in user
// hammering the key gets stopped, but the count isn't exact across instances.
// Swap for a Convex table (or Upstash) if you need a real global quota.
function rateLimited(id: string): boolean {
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(id, recent);
  // Bound the map so a long-lived instance can't leak one entry per user.
  if (hits.size > 500) {
    for (const [k, v] of hits) if (now - v[v.length - 1] > WINDOW_MS) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
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

  const userId = await callerId(req);
  if (!userId) {
    return new Response("Sign in to use the assistant.", { status: 401 });
  }

  if (rateLimited(userId)) {
    return new Response("Too many messages — wait a minute and try again.", {
      status: 429,
      headers: { "retry-after": "60" },
    });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: anthropic(MODEL),
    system:
      "You are a concise, helpful assistant embedded in a Convex + Next.js starter app. Answer directly.",
    messages: await convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
