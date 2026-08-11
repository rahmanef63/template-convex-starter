import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { OsRoute } from "./os-route";

// Its own title + description so /os and "/" stop competing for one snippet.
// Every route declares its own `alternates.canonical` — the root layout sets
// none, precisely so a forgotten override can't hand a page someone else's URL.
// openGraph repeats siteName/type because a child openGraph replaces the
// parent's whole object (the card image still comes from app/opengraph-image.tsx).
const TITLE = "OS dashboard demo";
const DESCRIPTION =
  "Try the dashboard shell — adaptive sidebar, mobile dock, workspace switching, plus Convex-backed notes and a Claude assistant once you sign in.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/os" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    url: "/os",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function OsPage() {
  return <OsRoute />;
}
