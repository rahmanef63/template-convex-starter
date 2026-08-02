// SSOT for the OS shell's features — PER WORKSPACE. Each workspace owns its own
// menu, so the workspace switcher swaps the sidebar / dock / breadcrumb / content
// for real (see menuForWorkspace + app/os/os-shell.tsx). `icon` keys into
// components/os/icons.tsx. These are generic placeholders — rename/replace them
// (and give each workspace its real features) as you build the app out.
export type FeatureGroup = "project" | "system";

export type MenuItem = {
  slug: string;
  label: string;
  sub: string;
  icon: string;
  group: FeatureGroup;
};

// The mobile dock's raised center action — a distinct primary action shared by
// every workspace, so it lives outside the per-workspace menus.
export const FAB: MenuItem = {
  slug: "assistant",
  label: "Assistant",
  sub: "Ask anything — placeholder",
  icon: "sparkle",
  group: "project",
};

// Compact builders for the placeholder menus below.
const proj = (n: number, icon: string): MenuItem => ({
  slug: `feature-${n}`,
  label: `Feature ${n}`,
  sub: "Placeholder feature",
  icon,
  group: "project",
});
const sys = (slug: string, label: string, sub: string, icon: string): MenuItem => ({
  slug,
  label,
  sub,
  icon,
  group: "system",
});

// A workspace + its features. `id` is the Convex `_id` for signed-in users, or a
// stable slug for the logged-out placeholder set below — the shell only needs a
// string key. Mirrors the `workspaces` table shape (convex/schema.ts).
export type Workspace = {
  id: string;
  name: string;
  plan: string;
  icon: string;
  features: MenuItem[];
};

// Logged-out placeholder set (the public demo) AND the seed sent to Convex on a
// new user's first visit (workspaces.ensureSeeded). Each has a DIFFERENT menu so
// switching visibly swaps the sidebar, dock, breadcrumb, and screen: Free has
// fewer features, Enterprise more.
export const WORKSPACES: Workspace[] = [
  {
    id: "acme",
    name: "Acme Inc",
    plan: "Pro",
    icon: "sparkle",
    features: [
      proj(1, "home"),
      proj(2, "folder"),
      proj(3, "chart"),
      proj(4, "doc"),
      sys("members", "Members", "People and permissions", "people"),
      sys("billing", "Billing", "Plan and invoices", "card"),
      sys("settings", "Settings", "Workspace configuration", "gear"),
    ],
  },
  {
    id: "monsters",
    name: "Monsters LLC",
    plan: "Free",
    icon: "folder",
    features: [
      proj(1, "home"),
      proj(2, "folder"),
      sys("settings", "Settings", "Workspace configuration", "gear"),
    ],
  },
  {
    id: "hooli",
    name: "Hooli",
    plan: "Enterprise",
    icon: "chart",
    features: [
      proj(1, "home"),
      proj(2, "folder"),
      proj(3, "chart"),
      proj(4, "doc"),
      proj(5, "people"),
      proj(6, "card"),
      sys("members", "Members", "People and permissions", "people"),
      sys("billing", "Billing", "Plan and invoices", "card"),
      sys("audit", "Audit log", "Every action, logged", "search"),
      sys("settings", "Settings", "Workspace configuration", "gear"),
    ],
  },
];

// Split one workspace's features into the two nav groups + a slug lookup. Cheap
// (filters a small array) — the shell calls it for the active workspace, whether
// the workspaces came from Convex or the placeholder set.
export function splitFeatures(features: MenuItem[]) {
  return {
    project: features.filter((m) => m.group === "project"),
    system: features.filter((m) => m.group === "system"),
    bySlug: Object.fromEntries(features.map((m) => [m.slug, m])) as Record<string, MenuItem>,
  };
}

// Signed-in user (sidebar footer nav-user) — placeholder. Swap for the real
// @convex-dev/auth user (name/email from the users table) when auth is wired in.
export type OsUser = { name: string; email: string; initials: string };

export const USER: OsUser = {
  name: "Jane Cooper",
  email: "jane@acme.com",
  initials: "JC",
};
