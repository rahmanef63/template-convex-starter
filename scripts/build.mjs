// Build entrypoint for Vercel (package.json "build:auto"). Decides, per
// environment, whether this build may touch the Convex backend:
//
//   deploy + build   CONVEX_DEPLOY_KEY present AND this is not a preview build
//                    using a non-preview key. Provisions auth keys first
//                    (scripts/setup-auth.mjs), then `convex deploy --cmd`.
//   frontend-only    Preview build with a production/dev key (SAFETY: a PR
//                    preview must never push its backend code to production),
//                    or no key but NEXT_PUBLIC_CONVEX_URL is set.
//   fail             On Vercel with neither env var — misconfiguration.
//   plain build      Local `npm run build:auto` without Convex env.
//
// To get real backend previews per PR, set a *preview* deploy key
// (starts with "preview:") for Vercel's Preview environment. See README.
import { execFileSync } from "node:child_process";

const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit" });
const nextBuild = () => run("npx", ["next", "build"]);

const key = process.env.CONVEX_DEPLOY_KEY;
const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const isPreview = process.env.VERCEL_ENV === "preview";

if (key && isPreview && !key.startsWith("preview:")) {
  console.log(
    "[build] PREVIEW build with a non-preview deploy key — skipping `convex deploy` " +
      "so PR code never reaches the production backend. Building frontend only" +
      (url ? ` against ${url}.` : ". WARNING: NEXT_PUBLIC_CONVEX_URL is unset, data won't load."),
  );
  nextBuild();
} else if (key) {
  run("node", ["scripts/setup-auth.mjs"]);
  run("npx", ["convex", "deploy", "--cmd", "next build"]);
} else if (url) {
  console.log(
    "[build] No CONVEX_DEPLOY_KEY — building frontend against existing " +
      "NEXT_PUBLIC_CONVEX_URL (backend not redeployed).",
  );
  nextBuild();
} else if (process.env.VERCEL === "1") {
  console.error("[build] Missing CONVEX_DEPLOY_KEY and NEXT_PUBLIC_CONVEX_URL; set one in Vercel env.");
  process.exit(1);
} else {
  nextBuild();
}
