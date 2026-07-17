"use client";

// Sidebar HEADER — replaces the old "STARTER OS" brand link. A workspace picker
// over the shared Dropdown (opens downward). Controlled: the shell owns the active
// id and, on change, swaps the whole menu for that workspace (menuForWorkspace in
// menu.ts) — the sidebar nav, dock, breadcrumb, and content all follow.
import { type Workspace } from "./menu";
import { Icon } from "./icons";
import { Dropdown, DropdownItem, DropdownDivider } from "./dropdown";

export function WorkspaceSwitcher({
  workspaces,
  activeId,
  onChange,
}: {
  workspaces: Workspace[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];
  if (!active) return null;

  return (
    <Dropdown
      label="Switch workspace"
      side="bottom"
      trigger={
        <span className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-card-hover">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Icon name={active.icon} className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold tracking-tight">
              {active.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{active.plan}</span>
          </span>
          <Icon name="chevrons-up-down" className="h-4 w-4 shrink-0 text-muted-foreground" />
        </span>
      }
    >
      {(close) => (
        <>
          <p className="px-2.5 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Workspaces
          </p>
          {workspaces.map((w) => {
            const isActive = w.id === activeId;
            return (
              <DropdownItem
                key={w.id}
                onClick={() => {
                  onChange(w.id);
                  close();
                }}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-card-hover">
                  <Icon name={w.icon} className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate">{w.name}</span>
                {isActive && <Icon name="check" className="h-4 w-4 shrink-0 text-accent" />}
              </DropdownItem>
            );
          })}
          <DropdownDivider />
          {/* Inert placeholder — no create flow yet. */}
          <DropdownItem disabled>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border">
              <Icon name="plus" className="h-3.5 w-3.5" />
            </span>
            <span>Add workspace</span>
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}
