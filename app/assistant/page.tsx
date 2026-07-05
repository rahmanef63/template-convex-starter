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
          className="text-sm text-neutral-500 transition hover:text-neutral-900 dark:hover:text-white"
        >
          ← Dashboard
        </Link>
      </header>

      <AuthLoading>
        <p className="mt-8 text-sm text-neutral-500">Loading…</p>
      </AuthLoading>

      <Unauthenticated>
        <div className="mt-8 rounded-2xl border border-neutral-200 p-8 text-center dark:border-neutral-800">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Sign in to use the assistant.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-neutral-900"
          >
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
          <p className="text-sm text-neutral-500">
            Ask anything to try the Claude-powered assistant.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="mr-2 font-mono text-xs uppercase tracking-wide text-neutral-400">
              {m.role === "user" ? "you" : "ai"}
            </span>
            <span className="whitespace-pre-wrap">{m.content}</span>
          </div>
        ))}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
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
          className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:focus:border-neutral-600"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {isLoading ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
