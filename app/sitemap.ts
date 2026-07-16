import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Public pages only — private routes are noindexed via robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
