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
  // Project features — generic placeholders. Rename these to your real features.
  { slug: "feature-1", label: "Feature 1", sub: "Placeholder feature", icon: "home", group: "project" },
  { slug: "feature-2", label: "Feature 2", sub: "Placeholder feature", icon: "folder", group: "project" },
  { slug: "feature-3", label: "Feature 3", sub: "Placeholder feature", icon: "chart", group: "project" },
  { slug: "feature-4", label: "Feature 4", sub: "Placeholder feature", icon: "doc", group: "project" },
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

// --- Workspace switcher (sidebar header) ---------------------------------
// Placeholder workspaces for the switcher. `icon` keys into icons.tsx like a
// MenuItem. Kept a real typed model so the seam below is honest.
export type Workspace = {
  id: string;
  name: string;
  plan: string;
  icon: string;
};

export const WORKSPACES: Workspace[] = [
  { id: "acme", name: "Acme Inc", plan: "Pro", icon: "sparkle" },
  { id: "monsters", name: "Monsters LLC", plan: "Free", icon: "folder" },
  { id: "hooli", name: "Hooli", plan: "Enterprise", icon: "chart" },
];

// SEAM — switching workspace is cosmetic for now (WorkspaceSwitcher just sets
// state in the shell). A real impl would derive the menu PER workspace here,
// e.g. `menuForWorkspace(id): { project: MenuItem[]; system: MenuItem[] }`,
// and the shell would read from that instead of the module-level PROJECT_FEATURES
// / SYSTEM_FEATURES. The data model above is already shaped for that — wire it
// when workspaces actually diverge; don't build the switching before it's needed.

// --- Signed-in user (sidebar footer nav-user) ----------------------------
// Placeholder identity for NavUser. Swap for the real @convex-dev/auth user
// (name/email from the users table) when auth is wired into the OS shell.
export type OsUser = { name: string; email: string; initials: string };

export const USER: OsUser = {
  name: "Jane Cooper",
  email: "jane@acme.com",
  initials: "JC",
};
