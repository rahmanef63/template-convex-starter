// Site identity SSOT — the name, copy, colors, and URL used by the metadata in
// `app/layout.tsx`, the OG image, the web manifest, robots, and the sitemap.
// Change them here once; every surface follows.
export const SITE_NAME = "Convex Starter";
export const SITE_TAGLINE = "Full-stack, already wired.";
export const SITE_DESCRIPTION =
  "Next.js + Convex, wired and ready. Set 4 env vars, deploy to Vercel, ship.";

// Mirrors the dark `:root` tokens in `app/globals.css`. Duplicated on purpose:
// the OG image renderer (satori) and the web manifest are both outside the
// browser, so neither can read a CSS variable. Keep the two in sync.
export const BRAND = {
  bg: "#0a0a0a",
  fg: "#ededed",
  muted: "#8f8f8f",
  accent: "#f5b544",
} as const;

// Canonical site URL for metadata, robots, and sitemap (server-side only —
// derives from Vercel's env on deploys, SITE_URL/localhost elsewhere).
export function siteUrl(): string {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return process.env.SITE_URL || "http://localhost:3000";
}
