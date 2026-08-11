"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { ConvexError } from "convex/values";
import { errorMessage } from "@/lib/errors";

// One form, three modes; "verify" is reset's second step (code + new password).
type Mode = "signIn" | "signUp" | "reset";
type State = Mode | "verify";
type Copy = { heading: string; subtitle: string; action: string; link: string; fallback: string };

const ERROR_ID = "auth-error";
// The only reset failures that don't depend on which address was typed — see submit().
const NEUTRAL = new Set(["NOT_CONFIGURED", "RATE_LIMITED"]);
const isNeutral = (err: unknown) =>
  err instanceof ConvexError && NEUTRAL.has(String((err.data as { code?: string })?.code));
const LINK =
  "text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline";

const RESET: Copy = {
  heading: "Reset password",
  subtitle: "We'll email you a code to set a new password.",
  action: "Email me a code",
  link: "Back to sign in",
  fallback: "Could not send a reset code. Check the address and try again.",
};

// All the copy in one place — heading, subtitle, submit label, footer link — so
// a state can't half-exist. `fallback` is what shows when the server's error
// isn't a ConvexError we're allowed to quote.
const COPY: Record<State, Copy> = {
  signIn: {
    heading: "Sign in", subtitle: "Welcome back.", action: "Sign in",
    link: "Need an account? Sign up", fallback: "Wrong email or password.",
  },
  signUp: {
    heading: "Create account", subtitle: "Sign up to get started.", action: "Sign up",
    link: "Have an account? Sign in",
    fallback: "Could not sign up. Use a valid email and an 8+ character password.",
  },
  reset: RESET,
  // The verify subtitle names the address, so it's built at render time.
  verify: { ...RESET, subtitle: "", action: "Set new password",
    fallback: "That code is wrong or expired. Request a new one." },
};

type FieldProps = { id: string; label: string; invalid: boolean } &
  React.InputHTMLAttributes<HTMLInputElement>;

// One labelled input. Every field here goes through it, so the label, the error
// wiring, and the shared `.field` look can't drift between them.
function Field({ id, label, invalid, ...props }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        id={id}
        className="field"
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? ERROR_ID : undefined}
        {...props}
      />
    </div>
  );
}

export function LoginClient() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signIn");
  const [sent, setSent] = useState(false); // reset: a code is on its way
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (e.g. hit /login from a bookmark) → nothing to fill in.
  useEffect(() => {
    if (isAuthenticated) router.replace("/os");
  }, [isAuthenticated, router]);

  const state: State = sent ? "verify" : mode;
  const copy = COPY[state];
  const invalid = error !== null;

  function switchTo(next: Mode) {
    setMode(next);
    setSent(false);
    setError(null);
    setCode("");
    setNewPassword("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return; // the submit button stays focusable while busy (see below)
    setBusy(true);
    setError(null);
    try {
      if (state === "reset") {
        try {
          await signIn("password", { email, flow: "reset" });
        } catch (err) {
          // Only failures that are the same for *every* address may be shown, or
          // this form confirms who has an account. convex/auth.ts already
          // collapses the rest server-side; this is the second lock on that door.
          if (isNeutral(err)) throw err;
        }
        setSent(true);
        return;
      }
      if (state === "verify") {
        // Succeeding here signs you in and invalidates your other sessions.
        await signIn("password", { email, code, newPassword, flow: "reset-verification" });
      } else {
        await signIn("password", { email, password, flow: mode });
      }
      router.push("/os");
    } catch (err) {
      // Surface a server-thrown message when present; otherwise a clear fallback.
      setError(errorMessage(err, copy.fallback));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="card w-full max-w-sm p-7">
        <h1 className="text-xl font-semibold tracking-tight">{copy.heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {state === "verify"
            // The mail carries the expiry (convex/auth.ts owns that number) —
            // repeating it here would be the same fact in two places.
            ? `If ${email} has an account, a code is on its way. Check your email.`
            : copy.subtitle}
        </p>
        <form onSubmit={submit} aria-busy={busy} className="mt-6 space-y-4">
          {/* readOnly once the code is out (the code is bound to that address) — not
              disabled, which would drop the input out of the tab order. */}
          <Field
            id="auth-email"
            label="Email"
            invalid={invalid}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={state === "verify"}
            required
            autoComplete="email"
          />
          {mode !== "reset" && (
            <Field
              id="auth-password"
              label="Password"
              invalid={invalid}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            />
          )}
          {state === "verify" && (
            <>
              <Field
                id="auth-code"
                label="Reset code"
                invalid={invalid}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoComplete="one-time-code"
              />
              <Field
                id="auth-new-password"
                label="New password"
                invalid={invalid}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </>
          )}
          {error && <p id={ERROR_ID} role="alert" className="text-sm text-destructive">{error}</p>}
          {/* aria-disabled, not disabled: a disabled button drops out of the tab
              order mid-submit and dumps keyboard focus on <body>. */}
          <button type="submit" aria-disabled={busy} className="btn-primary w-full aria-disabled:opacity-50">
            {busy ? "Working…" : copy.action}
          </button>
        </form>
        <div className="mt-4 flex flex-col items-start gap-2">
          {state === "signIn" && (
            <button type="button" onClick={() => switchTo("reset")} className={LINK}>
              Forgot your password?
            </button>
          )}
          <button type="button" onClick={() => switchTo(mode === "signIn" ? "signUp" : "signIn")} className={LINK}>
            {copy.link}
          </button>
        </div>
      </div>
    </main>
  );
}
