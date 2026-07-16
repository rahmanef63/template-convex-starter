// SSOT for the OS shell's app list. BOTH the desktop sidebar (app/os/os-shell.tsx)
// and the mobile dock/sheet (components/os/os-dock.tsx, more-sheet.tsx) render
// from this one array — add an app here and it shows up everywhere. `icon` keys
// into components/os/icons.tsx. These are generic placeholders: rename/replace
// them with your real apps as you build screens out.
export type MenuItem = {
  slug: string;
  label: string;
  sub: string;
  icon: string;
};

export const MENU: MenuItem[] = [
  { slug: "home", label: "Home", sub: "Overview of your workspace", icon: "home" },
  { slug: "overview", label: "Overview", sub: "Key metrics at a glance", icon: "chart" },
  { slug: "reports", label: "Reports", sub: "Generated summaries and exports", icon: "doc" },
  { slug: "files", label: "Files", sub: "Documents and uploads", icon: "folder" },
  { slug: "team", label: "Team", sub: "People and permissions", icon: "people" },
  { slug: "settings", label: "Settings", sub: "Workspace configuration", icon: "gear" },
];

// The mobile dock's raised center action. Not a sidebar item — it's a distinct
// primary action, so it lives outside MENU but resolves through MENU_BY_SLUG's
// fallback so the shell can title it like any other app.
export const FAB: MenuItem = {
  slug: "assistant",
  label: "Assistant",
  sub: "Ask anything — placeholder",
  icon: "sparkle",
};

export const MENU_BY_SLUG: Record<string, MenuItem> = Object.fromEntries(
  MENU.map((m) => [m.slug, m]),
);
