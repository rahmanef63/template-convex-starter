"use client";

import { useCallback, useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/components/toast";
import { errorMessage } from "@/lib/errors";
import { CORE_VERSION, UPDATE_DOCS_URL, compareVersions } from "@/lib/version";

// "You're on v1.0.0, the template shipped v1.1.0" — the one thing a deployed
// clone can't work out on its own. Getting the new *code* is a git pull the
// owner runs (`bun run update:template`); the button here only re-deploys, which
// is what picks up env changes and, once the code is pulled, ships it.
export function UpdateCard() {
  const latestVersion = useAction(api.update.latestVersion);
  const rebuild = useAction(api.update.rebuild);
  const toast = useToast();
  const [latest, setLatest] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);

  // Offline or upstream down resolves to null — reported as "unknown" below,
  // never as an error the owner has to care about.
  const load = useCallback(
    () =>
      latestVersion()
        .then((r) => r?.core ?? null)
        .catch(() => null),
    [latestVersion],
  );

  // State lands in the promise callback, not in the effect body: the effect
  // itself must not setState (react-hooks/set-state-in-effect), and the `alive`
  // flag drops a response that arrives after the screen changed.
  useEffect(() => {
    let alive = true;
    void load().then((v) => {
      if (!alive) return;
      setLatest(v);
      setChecking(false);
    });
    return () => {
      alive = false;
    };
  }, [load]);

  async function check() {
    setChecking(true);
    setLatest(await load());
    setChecking(false);
  }

  const behind = latest !== null && compareVersions(latest, CORE_VERSION) > 0;

  async function onRebuild() {
    setBusy(true);
    try {
      const r = await rebuild();
      if (r.ok) toast("Rebuild started — your site updates in a few minutes.");
      else if (r.reason === "no-hook")
        toast("No deploy hook set. Add VERCEL_DEPLOY_HOOK_URL to your Convex env.", {
          variant: "error",
        });
      else toast("Could not reach the deploy hook.", { variant: "error" });
    } catch (err) {
      // Not the owner, or over the rebuild budget — the server says which.
      toast(errorMessage(err, "Could not start a rebuild."), { variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Version &amp; updates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Running <span className="font-mono text-foreground">v{CORE_VERSION}</span>
            {checking
              ? " · checking for updates…"
              : latest === null
                ? " · couldn't reach the template"
                : behind
                  ? ` · v${latest} is available`
                  : " · up to date"}
          </p>
        </div>
        <span
          className={
            behind
              ? "rounded-full border border-accent/30 bg-accent/[0.06] px-3 py-1 text-xs font-medium text-accent"
              : "rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground"
          }
        >
          {checking ? "checking" : behind ? "update available" : "current"}
        </span>
      </div>

      {behind && (
        <p className="mt-4 text-sm text-muted-foreground">
          Pull the new code into your clone with{" "}
          <code className="rounded bg-card-hover px-1.5 py-0.5 font-mono text-xs">
            bun run update:template
          </code>
          , then push — Vercel rebuilds on its own.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onRebuild} disabled={busy} className="btn-primary">
          {busy ? "Starting…" : "Rebuild site"}
        </button>
        <button type="button" onClick={check} disabled={checking} className="btn-ghost">
          Check again
        </button>
        <a href={UPDATE_DOCS_URL} target="_blank" rel="noreferrer" className="btn-ghost">
          How updates work ↗
        </a>
      </div>
    </section>
  );
}
