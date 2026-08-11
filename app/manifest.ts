import type { MetadataRoute } from "next";
import { BRAND, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

// Web app manifest — makes the app installable and fixes the Lighthouse PWA
// basics. `start_url` is /os because that's where a signed-in user lands.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME.split(" ")[0],
    description: SITE_DESCRIPTION,
    start_url: "/os",
    display: "standalone",
    background_color: BRAND.bg,
    theme_color: BRAND.bg,
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
