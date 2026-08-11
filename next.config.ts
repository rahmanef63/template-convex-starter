import type { NextConfig } from "next";

// Security headers for every response, static pages included (a proxy/middleware
// would miss the prerendered ones). One place to audit — see CHECKLIST.md → Security.
//
// No Content-Security-Policy on purpose: a correct one needs per-request nonces
// (a proxy + `headers()` plumbing) and a wrong one silently breaks the app. Add
// it when you have a real inline-script inventory — CHECKLIST.md says how.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // HTTPS-only for 2 years. Vercel serves HTTPS everywhere; drop `preload` if
  // you ever need a plain-HTTP subdomain.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework version.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
