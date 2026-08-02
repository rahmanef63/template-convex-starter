"use client";

// The OS shell — the post-login home, and the same layout logged out as a public
// demo. No routing: one `active` slug in state drives the sidebar, dock, topbar,
// and body; <Screen> maps that slug to what renders. Notes (Convex) and Assistant
// (Claude) are real features; every other slug in a workspace's menu is
// placeholder scaffolding to replace as you build the app out (menu.ts).
import { useState } from "react";
import {
  splitFeatures,
  FAB,
  type MenuItem,
  type Workspace,
} from "@/components/os/menu";
import { Icon } from "@/components/os/icons";
import { Screen } from "@/components/os/screens";
import { OsDock } from "@/components/os/os-dock";
import { MoreSheet } from "@/components/os/more-sheet";
import { Topbar } from "@/components/os/topbar";
import { WorkspaceSwitcher, type WorkspaceManage } from "@/components/os/workspace-switcher";
import { NavUser } from "@/components/os/nav-user";
import { cn } from "@/lib/cn";

export function OsShell({
  workspaces,
  manage,
}: {
  workspaces: Workspace[];
  manage?: WorkspaceManage;
}) {
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const activeWorkspace = workspaces.find((w) => w.id === workspaceId) ?? workspaces[0];
  const menu = splitFeatures(activeWorkspace?.features ?? []);
  const [active, setActive] = useState(menu.project[0]?.slug ?? FAB.slug);
  const [moreOpen, setMoreOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const app = menu.bySlug[active] ?? FAB;
  const isSystem = app.group === "system";

  // Switching workspace swaps the whole menu. Keep the active feature only if the
  // new workspace still has it (or it's the shared Assistant) — else land on its
  // first feature so the content never points at a feature this workspace lacks.
  function selectWorkspace(id: string) {
    setWorkspaceId(id);
    const ws = workspaces.find((w) => w.id === id);
    // A just-created workspace isn't in the reactive list yet — keep the current
    // feature (it stays valid once the workspace loads) rather than falling to FAB.
    if (!ws) return;
    const next = splitFeatures(ws.features);
    setActive((cur) =>
      cur === FAB.slug || cur in next.bySlug ? cur : next.project[0]?.slug ?? FAB.slug,
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside
        className={cn(
          "hidden w-64 shrink-0 flex-col border-r border-border bg-card/40 p-4",
          collapsed ? "md:hidden" : "md:flex",
        )}
      >
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeId={workspaceId}
          onChange={selectWorkspace}
          manage={manage}
        />
        <nav aria-label="Features" className="mt-5 flex flex-1 flex-col gap-5">
          {/* The Assistant is shared by every workspace, so it sits outside menu.project:
              the dock raises it as the FAB, the sidebar just leads the group with it. */}
          <NavGroup
            label="Project"
            items={[FAB, ...menu.project]}
            active={active}
            onSelect={setActive}
          />
          <NavGroup label="System" items={menu.system} active={active} onSelect={setActive} />
        </nav>
        <div className="mt-4 border-t border-border pt-3">
          <NavUser />
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-7">
        <Topbar
          app={app}
          workspaceName={activeWorkspace?.name ?? ""}
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((v) => !v)}
        />
        <header className="pb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            {isSystem ? "System" : "Workspace"}
          </p>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{app.label}</h1>
          <p className="truncate text-sm text-muted-foreground">{app.sub}</p>
        </header>

        <Screen app={app} />

        <div className="h-[calc(6rem+env(safe-area-inset-bottom))] md:hidden" />
      </main>

      <OsDock
        projectFeatures={menu.project}
        active={active}
        onSelect={setActive}
        onOpenMore={() => setMoreOpen(true)}
      />
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        project={menu.project}
        system={menu.system}
        active={active}
        onSelect={setActive}
      />
    </div>
  );
}

function NavGroup({
  label,
  items,
  active,
  onSelect,
}: {
  label: string;
  items: MenuItem[];
  active: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {items.map((item) => (
        <NavItem key={item.slug} item={item} active={item.slug === active} onSelect={onSelect} />
      ))}
    </div>
  );
}

function NavItem({
  item,
  active,
  onSelect,
}: {
  item: MenuItem;
  active: boolean;
  onSelect: (slug: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.slug)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
        active
          ? "bg-accent/12 text-foreground"
          : "text-muted-foreground hover:bg-card-hover hover:text-foreground",
      )}
    >
      <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", active && "text-accent")}>
        <Icon name={item.icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="truncate">{item.label}</span>
    </button>
  );
}
