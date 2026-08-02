"use client";

// Global error boundary — catches render/data errors below the root layout.
// `reset()` re-renders the segment; pair it with a reload for a full retry.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="card w-full max-w-sm p-7 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Error
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.digest ? `Reference: ${error.digest}` : "An unexpected error occurred."}
        </p>
        <button onClick={reset} className="btn-primary mt-6">
          Try again
        </button>
      </div>
    </main>
  );
}
