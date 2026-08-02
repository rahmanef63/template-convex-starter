// Stage detection. NEXT_PUBLIC_DEMO=1 is set ONLY on the live showcase, so the
// "Clone this project" button renders there and vanishes on a real clone (the
// cloner already has the repo). Same pattern as the rest of the fleet.
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

const REPO = "https://github.com/rahmanef63/template-convex-starter";

// Vercel deploy/clone link — forks the repo and prompts the cloner for the two
// infra env vars (the only ones they must set; the rest are auto).
export const CLONE_URL =
  process.env.NEXT_PUBLIC_CLONE_URL ||
  `https://vercel.com/new/clone?repository-url=${REPO}` +
    `&env=NEXT_PUBLIC_CONVEX_URL,CONVEX_DEPLOY_KEY` +
    `&envDescription=${encodeURIComponent("Convex deployment URL + production deploy key (see README)")}` +
    `&envLink=${encodeURIComponent(`${REPO}/blob/main/README.md`)}` +
    `&project-name=my-convex-app&repository-name=my-convex-app`;

export const REPO_URL = REPO;
