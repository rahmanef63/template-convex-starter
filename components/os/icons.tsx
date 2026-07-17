import type { SVGProps } from "react";

// Inline stroke-icon set — no icon-lib dependency (lucide et al. are banned).
// Each entry is the `d` of a 24-viewBox line icon; multiple subpaths in one
// string is fine (each `M` starts a new one). Size at the call site with
// h-/w- utilities; color follows `currentColor`. Unknown name → empty path.
const PATHS: Record<string, string> = {
  home: "M3 10.5 12 4l9 6.5M5 9V20h14V9",
  chart: "M4 20V10M10 20V4M16 20v-6M4 20h16",
  doc: "M6 3h7l5 5v13H6zM13 3v5h5",
  folder: "M3 7h6l2 2h10v10H3z",
  people:
    "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M4 20a5 5 0 0 1 10 0M17 11a3 3 0 1 0 0-6M20 20a5 5 0 0 0-4-4.9",
  gear:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 2h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12q0 .6.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 22h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6q.1-.6.1-1.2Z",
  sparkle: "M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z",
  card: "M3 6h18v12H3zM3 10h18",
  // three round-capped zero-length strokes render as dots
  more: "M6 12h.01M12 12h.01M18 12h.01",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-3.6-3.6",
};

export function Icon({
  name,
  ...props
}: { name: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d={PATHS[name] ?? ""} />
    </svg>
  );
}
