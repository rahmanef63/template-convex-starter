import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Every route renders public content — /os shows its placeholder shell when
// logged out, so it's worth indexing as the dashboard demo.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/os`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
