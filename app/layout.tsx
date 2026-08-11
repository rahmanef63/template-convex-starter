import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ConvexClientProvider } from "@/components/convex-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";
import { BRAND, SITE_NAME, SITE_DESCRIPTION, SITE_TAGLINE, siteUrl } from "@/lib/site";
import "./globals.css";

// Copy + colors come from lib/site.ts so the page, the OG image, and the
// manifest can never disagree. See CHECKLIST.md → SEO.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // No `alternates.canonical` or `openGraph.url` here: metadata merges shallowly,
  // so a URL set at the root becomes every nested route's canonical unless that
  // route remembers to override it — one forgotten page and a crawler reads it as
  // a duplicate of "/". Each route declares its own (app/page.tsx, /login, /os).
  openGraph: {
    title: SITE_NAME,
    description: SITE_TAGLINE,
    siteName: SITE_NAME,
    type: "website",
  },
  // No twitter:image needed — the card falls back to app/opengraph-image.tsx.
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_TAGLINE },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: BRAND.bg },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <ConvexClientProvider>{children}</ConvexClientProvider>
            </Suspense>
          </ToastProvider>
        </ThemeProvider>
        {/* Free on Vercel — no-ops off-Vercel and until you enable each in the
            project's Analytics / Speed Insights tab. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
