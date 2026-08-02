"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { errorMessage } from "@/lib/errors";

export function LoginClient() {
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
      setError(
        errorMessage(
          err,
          flow === "signIn"
            ? "Wrong email or password."
            : "Could not sign up. Use a valid email and an 8+ character password.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="card w-full max-w-sm p-7">
        <h1 className="text-xl font-semibold tracking-tight">
          {flow === "signIn" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {flow === "signIn" ? "Welcome back." : "Sign up to get started."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="field"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="field"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "…" : flow === "signIn" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setFlow(flow === "signIn" ? "signUp" : "signIn");
            setError(null);
          }}
          className="mt-4 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          {flow === "signIn" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
