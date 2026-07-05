import type { Metadata } from "next";
import { Suspense } from "react";
import { ConvexClientProvider } from "@/components/convex-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Convex Starter",
  description: "Next.js + Convex, wired and ready. Set 4 env vars, deploy to Vercel, ship.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Suspense fallback={null}>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
