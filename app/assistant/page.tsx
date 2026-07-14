"use client";

import Link from "next/link";
import { useChat } from "ai/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

// Demo AI chat wired to Claude via the Vercel AI SDK (see app/api/chat/route.ts).
// Gated behind sign-in so a public demo can't burn your API key. Use it as the
// reference pattern for your own AI features.
export default function AssistantPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Assistant</h1>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Dashboard
        </Link>
      </header>

      <AuthLoading>
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      </AuthLoading>

      <Unauthenticated>
        <div className="card mt-8 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Sign in to use the assistant.
          </p>
          <Link href="/login" className="btn-primary mt-4">
            Sign in
          </Link>
        </div>
      </Unauthenticated>

      <Authenticated>
        <Chat />
      </Authenticated>
    </main>
  );
}

function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat();

  return (
    <div className="mt-6 flex flex-1 flex-col">
      <div className="flex-1 space-y-4">
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
            <span className="whitespace-pre-wrap text-foreground">{m.content}</span>
          </div>
        ))}
        {error && (
          <p className="text-sm text-destructive">
            Assistant unavailable. Set <code>ANTHROPIC_API_KEY</code> in your env
            to enable it.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Message the assistant…"
          className="field"
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="btn-primary">
          {isLoading ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
