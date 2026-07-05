"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn("password", { email, password, flow });
      router.push("/dashboard");
    } catch (err) {
      // Surface a server-thrown message when present; otherwise a clear fallback.
      const data = (err as { data?: unknown })?.data;
      setError(
        typeof data === "string"
          ? data
          : flow === "signIn"
            ? "Wrong email or password."
            : "Could not sign up. Use a valid email and an 8+ character password.",
      );
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:focus:border-neutral-600";

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 p-7 dark:border-neutral-800">
        <h1 className="text-xl font-semibold tracking-tight">
          {flow === "signIn" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {flow === "signIn" ? "Welcome back." : "Sign up to get started."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputCls}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputCls}
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {busy ? "…" : flow === "signIn" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setFlow(flow === "signIn" ? "signUp" : "signIn");
            setError(null);
          }}
          className="mt-4 text-xs text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline dark:hover:text-white"
        >
          {flow === "signIn" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
