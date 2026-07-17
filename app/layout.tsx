import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ConvexClientProvider } from "@/components/convex-provider";
import { ToastProvider } from "@/components/toast";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Convex Starter", template: "%s · Convex Starter" },
  description: "Next.js + Convex, wired and ready. Set 4 env vars, deploy to Vercel, ship.",
  openGraph: {
    title: "Convex Starter",
    description: "Full-stack starter: auth, live data, AI — already wired.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ToastProvider>
          <Suspense fallback={null}>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </Suspense>
        </ToastProvider>
        {/* Free on Vercel — no-ops off-Vercel and until you enable each in the
            project's Analytics / Speed Insights tab. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
