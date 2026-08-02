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
// JWT (see app/assistant/assistant-client.tsx); we verify it by asking Convex
// who the caller is — invalid/expired tokens fail the query.
async function isAuthenticated(req: Request): Promise<boolean> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !process.env.NEXT_PUBLIC_CONVEX_URL) return false;
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  convex.setAuth(token);
  try {
    return (await convex.query(api.users.me, {})) !== null;
  } catch {
    return false;
  }
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

  if (!(await isAuthenticated(req))) {
    return new Response("Sign in to use the assistant.", { status: 401 });
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
