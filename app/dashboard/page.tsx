"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
  useMutation,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton } from "@/components/sign-out-button";

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-16">
      <AuthLoading>
        <p className="text-sm text-neutral-500">Loading…</p>
      </AuthLoading>

      <Unauthenticated>
        <div className="rounded-2xl border border-neutral-200 p-8 text-center dark:border-neutral-800">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            You need to sign in to view your notes.
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
        <Notes />
      </Authenticated>
    </main>
  );
}

function Notes() {
  const me = useQuery(api.users.me);
  const notes = useQuery(api.notes.list);
  const add = useMutation(api.notes.add);
  const toggle = useMutation(api.notes.toggle);
  const remove = useMutation(api.notes.remove);
  const [text, setText] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    await add({ text: t });
  }

  return (
    <div>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Your notes</h1>
          <p className="text-sm text-neutral-500">
            {me?.email ? `Signed in as ${me.email}` : "…"}
          </p>
        </div>
        <SignOutButton />
      </header>

      <form onSubmit={submit} className="mt-8 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a note…"
          className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:focus:border-neutral-600"
        />
        <button
          type="submit"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-neutral-900"
        >
          Add
        </button>
      </form>

      <ul className="mt-6 space-y-2">
        {notes === undefined && (
          <li className="text-sm text-neutral-500">Loading…</li>
        )}
        {notes?.length === 0 && (
          <li className="text-sm text-neutral-500">
            No notes yet. Add your first one above.
          </li>
        )}
        {notes?.map((n) => (
          <li
            key={n._id}
            className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800"
          >
            <button
              onClick={() => toggle({ id: n._id })}
              aria-label={n.done ? "Mark not done" : "Mark done"}
              className={`grid size-5 shrink-0 place-items-center rounded border text-xs ${
                n.done
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-300 dark:border-neutral-700"
              }`}
            >
              {n.done ? "✓" : ""}
            </button>
            <span
              className={`flex-1 text-sm ${
                n.done ? "text-neutral-400 line-through" : ""
              }`}
            >
              {n.text}
            </span>
            <button
              onClick={() => remove({ id: n._id })}
              aria-label="Delete note"
              className="text-neutral-400 transition hover:text-red-600 dark:hover:text-red-400"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
