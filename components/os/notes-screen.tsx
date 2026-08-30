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
import { Skeleton } from "@/components/skeleton";
import { useToast } from "@/components/toast";
import { errorMessage } from "@/lib/errors";

// The one REAL feature screen: per-user notes backed by convex/notes.ts. It gates
// itself because /os doubles as the logged-out demo and notes.list throws for an
// anonymous caller — an ungated useQuery would trip the error boundary.
export function NotesScreen() {
  return (
    <>
      <AuthLoading>
        {/* aria-label is only honoured on an element with a role — a bare <div>
            drops it (and axe flags it as a prohibited attribute). */}
        <div role="status" aria-label="Loading notes" className="w-full space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="card w-full p-6 text-center sm:p-8">
          <p className="text-sm text-muted-foreground">Sign in to see your notes.</p>
          <Link href="/login" className="btn-primary mt-4">
            Sign in
          </Link>
        </div>
      </Unauthenticated>

      <Authenticated>
        <Notes />
      </Authenticated>
    </>
  );
}

function Notes() {
  const notes = useQuery(api.notes.list);
  const add = useMutation(api.notes.add);
  const toggle = useMutation(api.notes.toggle);
  const remove = useMutation(api.notes.remove);
  const [text, setText] = useState("");
  const toast = useToast();

  // Every mutation funnels through this: expected failures (ConvexError from
  // the backend) surface their message, anything else a generic toast.
  async function tryMutation(op: () => Promise<unknown>) {
    try {
      await op();
    } catch (err) {
      toast(errorMessage(err), { variant: "error" });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    await tryMutation(() => add({ text: t }));
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="New note"
          placeholder="Add a note…"
          className="field"
        />
        <button type="submit" className="btn-primary w-full sm:w-auto">
          Add
        </button>
      </form>

      <ul className="mt-5 space-y-2 sm:mt-6">
        {notes === undefined && (
          <>
            <li>
              <Skeleton className="h-10 w-full" />
            </li>
            <li>
              <Skeleton className="h-10 w-2/3" />
            </li>
          </>
        )}
        {notes?.length === 0 && (
          <li className="text-sm text-muted-foreground">
            No notes yet. Add your first one above.
          </li>
        )}
        {notes?.map((n) => (
          <li
            key={n._id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
          >
            <button
              onClick={() => tryMutation(() => toggle({ id: n._id }))}
              // A toggle button: stable name (unique per row, so voice control and
              // the rotor can tell the rows apart) + state via aria-pressed. The
              // ✓ glyph and the fill are decoration on top of that.
              aria-label={`Mark “${n.text}” done`}
              aria-pressed={n.done}
              className={`grid size-5 shrink-0 place-items-center rounded border text-xs transition-colors ${
                n.done
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border-hover"
              }`}
            >
              {n.done ? "✓" : ""}
            </button>
            <span
              className={`flex-1 text-sm ${
                n.done ? "text-muted-foreground line-through" : "text-foreground"
              }`}
            >
              {n.text}
            </span>
            <button
              onClick={() => tryMutation(() => remove({ id: n._id }))}
              aria-label={`Delete note: ${n.text}`}
              className="text-muted-foreground transition-colors hover:text-destructive"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
