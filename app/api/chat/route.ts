import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToCoreMessages } from "ai";

// The single knob for the AI tier. Swap for the model that fits your feature:
//   claude-opus-4-8  — hardest reasoning (priciest)
//   claude-sonnet-5  — best speed/quality balance (default, great for chat)
//   claude-haiku-4-5 — cheap + fast, simple tasks
const MODEL = "claude-sonnet-5";

export const maxDuration = 30;

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

  const { messages } = await req.json();
  const result = streamText({
    model: anthropic(MODEL),
    system:
      "You are a concise, helpful assistant embedded in a Convex + Next.js starter app. Answer directly.",
    messages: convertToCoreMessages(messages),
  });
  // ponytail: this route is unauthenticated. Fine while /assistant is gated
  // behind sign-in, but if you expose the chat publicly, verify the caller here
  // (convexAuthNextjsToken) so visitors can't burn your API key.
  return result.toDataStreamResponse();
}
