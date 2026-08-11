import { ImageResponse } from "next/og";
import { BRAND, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/site";

// Social preview card (og:image + twitter:image via `summary_large_image`).
// Rendered once at build time, so it costs nothing at runtime. Edit the copy in
// lib/site.ts, not here.
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: BRAND.bg,
          color: BRAND.fg,
          padding: 88,
          // A single accent hairline instead of a gradient — same restraint as the app.
          borderBottom: `12px solid ${BRAND.accent}`,
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: BRAND.accent,
          }}
        >
          {SITE_NAME}
        </div>
        <div style={{ marginTop: 28, fontSize: 84, fontWeight: 600, letterSpacing: -2 }}>
          {SITE_TAGLINE}
        </div>
        <div style={{ marginTop: 28, fontSize: 34, color: BRAND.muted, maxWidth: 880 }}>
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    size,
  );
}
