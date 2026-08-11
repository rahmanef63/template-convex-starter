"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAuthToken } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Skeleton } from "@/components/skeleton";

// Demo AI chat wired to Claude via the Vercel AI SDK (see app/api/chat/route.ts).
// Gated behind sign-in AND the route verifies the caller's Convex auth token,
// so a public deploy can't have its API key burned. Use it as the reference
// pattern for your own AI features.
export function AssistantScreen() {
  return (
    <>
      <AuthLoading>
        <div className="max-w-2xl space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="card max-w-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">Sign in to use the assistant.</p>
          <Link href="/login" className="btn-primary mt-4">
            Sign in
          </Link>
        </div>
      </Unauthenticated>

      <Authenticated>
        <Chat />
      </Authenticated>
    </>
  );
}

function Chat() {
  // The route requires the Convex auth JWT. It can refresh over time, so keep
  // the latest value in a ref and resolve headers per request.
  const token = useAuthToken();
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);
  // The headers callback runs per request (an event), never during render, so
  // reading the ref there is safe — the lint rule can't see across the boundary.
  const [transport] = useState(
    // eslint-disable-next-line react-hooks/refs
    () =>
      new DefaultChatTransport({
        headers: (): Record<string, string> =>
          tokenRef.current ? { authorization: `Bearer ${tokenRef.current}` } : {},
      }),
  );

  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void sendMessage({ text });
  }

  return (
    <div className="flex max-w-2xl flex-col">
      {/* The shell's <main> already scrolls, so the log gets its own bounded scroll
          instead of pushing the composer off-screen. */}
      <div className="max-h-[60vh] space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ask anything to try the Claude-powered assistant.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="mr-2 font-mono text-xs uppercase tracking-wide text-accent">
              {m.role === "user" ? "you" : "ai"}
            </span>
            <span className="whitespace-pre-wrap text-foreground">
              {m.parts.map((p) => (p.type === "text" ? p.text : "")).join("")}
            </span>
          </div>
        ))}
        {error && (
          // The route answers with a plain-text reason (offline / rate-limited /
          // signed out), which useChat surfaces as the error message.
          <p className="text-sm text-destructive">
            {error.message || "Assistant unavailable."}
          </p>
        )}
      </div>

      <form onSubmit={submit} className="mt-6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Message the assistant"
          placeholder="Message the assistant…"
          className="field"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-primary">
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
