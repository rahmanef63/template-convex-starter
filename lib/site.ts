// Canonical site URL for metadata, robots, and sitemap (server-side only —
// derives from Vercel's env on deploys, SITE_URL/localhost elsewhere).
export function siteUrl(): string {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return process.env.SITE_URL || "http://localhost:3000";
}
