// Build entrypoint for Vercel (package.json "build:auto"). It does two things,
// in this order:
//
// 1. THE GATE — lint + tests, on EVERY path, before anything can touch Convex.
//    Vercel's build is the only CI this repo has, and `next build` in Next 16
//    no longer runs ESLint (`next lint` was removed; see the Next 16 upgrade
//    guide) and has never run Vitest. Without this, a dependency bump that
//    reds the backend tests deploys green.
//
// 2. THE MODE — decides, per environment, whether this build may deploy the
//    Convex backend:
//
//   deploy + build   CONVEX_DEPLOY_KEY present AND this is not a preview build
//                    using a non-preview key. Provisions auth keys first
//                    (scripts/setup-auth.mjs), then `convex deploy --cmd`.
//   frontend-only    Preview build with a production/dev key (SAFETY: a PR
//                    preview must never push its backend code to production),
//                    or no key but NEXT_PUBLIC_CONVEX_URL is set.
//   fail             On Vercel with neither env var — misconfiguration.
//   plain build      Local `bun run build:auto` without Convex env.
//
// To get real backend previews per PR, set a *preview* deploy key
// (starts with "preview:") for Vercel's Preview environment. See README.
import { execFileSync } from "node:child_process";

const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit" });
const nextBuild = () => run("bunx", ["next", "build"]);

const key = process.env.CONVEX_DEPLOY_KEY;
const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const isPreview = process.env.VERCEL_ENV === "preview";

// Misconfiguration costs nothing to detect — report it before spending gate time.
if (!key && !url && process.env.VERCEL === "1") {
  console.error("[build] Missing CONVEX_DEPLOY_KEY and NEXT_PUBLIC_CONVEX_URL; set one in Vercel env.");
  process.exit(1);
}

// The gate. Runs before scripts/setup-auth.mjs and before `convex deploy`, so a
// red suite aborts with the backend untouched — no schema pushed, no functions
// replaced. (Vercel's `bun install` includes devDependencies, so eslint and
// vitest are present here.)
//
// ponytail: no standalone `tsc --noEmit` in the gate — it would be a third pass
// over the same files. `next build` still type-checks (the "Running TypeScript"
// step; next.config.ts does not set `typescript.ignoreBuildErrors`) and `convex
// deploy` type-checks convex/ before pushing, so backend type errors already
// abort pre-push. Ceiling: a *frontend-only* type error surfaces inside
// `next build`, i.e. after Convex was deployed — harmless (backend is valid,
// the build still fails red). Upgrade path: add `gate("types", "typecheck")`.
const gate = (what, script) => {
  console.log(`[build] gate: ${what} (bun run ${script})…`);
  try {
    run("bun", ["run", script]);
  } catch {
    console.error(`[build] GATE FAILED: ${what}. Nothing was deployed — fix it and rebuild.`);
    process.exit(1);
  }
};

gate("eslint", "lint");
gate("vitest", "test");
console.log("[build] gate passed (lint + tests green).");

if (key && isPreview && !key.startsWith("preview:")) {
  console.log(
    "[build] PREVIEW build with a non-preview deploy key — skipping `convex deploy` " +
      "so PR code never reaches the production backend. Building frontend only" +
      (url ? ` against ${url}.` : ". WARNING: NEXT_PUBLIC_CONVEX_URL is unset, data won't load."),
  );
  nextBuild();
} else if (key) {
  run("bun", ["scripts/setup-auth.mjs"]);
  run("bunx", ["convex", "deploy", "--cmd", "next build"]);
} else if (url) {
  console.log(
    "[build] No CONVEX_DEPLOY_KEY — building frontend against existing " +
      "NEXT_PUBLIC_CONVEX_URL (backend not redeployed).",
  );
  nextBuild();
} else {
  nextBuild();
}
