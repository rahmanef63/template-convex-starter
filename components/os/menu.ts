// SSOT for the OS shell's features. BOTH the desktop sidebar (app/os/os-shell.tsx)
// and the mobile dock/sheet render from this one array. `icon` keys into
// components/os/icons.tsx. Two kinds of feature, so the demo shows the difference:
//
//   group: "project"  — your app's own features. Render the DashboardScreen.
//   group: "system"   — settings-type surfaces (Settings, Members, Billing …).
//                       Render the SettingsScreen. See components/os/screens.tsx.
//
// These are generic placeholders — rename/replace them with your real features.
export type FeatureGroup = "project" | "system";

export type MenuItem = {
  slug: string;
  label: string;
  sub: string;
  icon: string;
  group: FeatureGroup;
};

export const MENU: MenuItem[] = [
  // Project features — the work the app is actually for.
  { slug: "dashboard", label: "Dashboard", sub: "Overview of your workspace", icon: "home", group: "project" },
  { slug: "projects", label: "Projects", sub: "Everything you're working on", icon: "folder", group: "project" },
  { slug: "tasks", label: "Tasks", sub: "What's on the list", icon: "chart", group: "project" },
  { slug: "reports", label: "Reports", sub: "Generated summaries and exports", icon: "doc", group: "project" },
  // System features — settings-type surfaces. These render the settings screen.
  { slug: "members", label: "Members", sub: "People and permissions", icon: "people", group: "system" },
  { slug: "billing", label: "Billing", sub: "Plan and invoices", icon: "card", group: "system" },
  { slug: "settings", label: "Settings", sub: "Workspace configuration", icon: "gear", group: "system" },
];

// The mobile dock's raised center action — a distinct primary action, so it lives
// outside MENU but resolves through MENU_BY_SLUG's fallback so the shell can title
// it like any other feature.
export const FAB: MenuItem = {
  slug: "assistant",
  label: "Assistant",
  sub: "Ask anything — placeholder",
  icon: "sparkle",
  group: "project",
};

export const PROJECT_FEATURES = MENU.filter((m) => m.group === "project");
export const SYSTEM_FEATURES = MENU.filter((m) => m.group === "system");

export const MENU_BY_SLUG: Record<string, MenuItem> = Object.fromEntries(
  MENU.map((m) => [m.slug, m]),
);
