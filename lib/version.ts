// Which version of the template this build is running, and how to compare it to
// upstream. `version.json` at the repo root is the SSOT (fleet contract — see
// _templates/CLAUDE.md); nothing else may hardcode a version string.
import manifest from "@/version.json";

export const CORE_VERSION: string = manifest.core || manifest.version;

export const TEMPLATE_REPO = "https://github.com/rahmanef63/template-convex-starter";
export const UPDATE_DOCS_URL = `${TEMPLATE_REPO}#updating-your-clone`;
// The upstream manifest URL lives in convex/update.ts, not here: only the
// backend fetches it, and keeping it there is what stops it being client-supplied.

/** >0 if `a` is newer than `b`, 0 if equal, <0 if older. Non-numeric parts sort as 0. */
export function compareVersions(a: string, b: string): number {
  const parts = (v: string) => v.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
