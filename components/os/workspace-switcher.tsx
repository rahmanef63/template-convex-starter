"use client";

// Sidebar HEADER — a workspace picker over the shared Dropdown. Controlled: the
// shell owns the active id + passes onChange (switch). When a `manage` object is
// supplied (the signed-in Convex path) the dropdown also creates / renames /
// deletes with inline views; without it (logged-out placeholder) it's switch-only.
import { useCallback, useState } from "react";
import { type Workspace } from "./menu";
import { Icon } from "./icons";
import { Dropdown, DropdownItem, DropdownDivider } from "./dropdown";

export type WorkspaceManage = {
  onCreate: () => Promise<string>; // resolves to the new workspace id
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type Mode = "list" | "rename" | "confirm";

export function WorkspaceSwitcher({
  workspaces,
  activeId,
  onChange,
  manage,
}: {
  workspaces: Workspace[];
  activeId: string;
  onChange: (id: string) => void;
  manage?: WorkspaceManage;
}) {
  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];
  const [mode, setMode] = useState<Mode>("list");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const resetMode = useCallback(() => setMode("list"), []);

  if (!active) return null;

  // Run a mutation: shows busy, calls `after` on success. The handlers toast +
  // rethrow on failure, so a throw just leaves the current view open.
  async function run(fn: () => Promise<unknown>, after: () => void) {
    setBusy(true);
    try {
      await fn();
      after();
    } catch {
      /* handler already surfaced the error */
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dropdown
      label="Switch workspace"
      side="bottom"
      onClose={resetMode}
      trigger={
        <span className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-card-hover">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Icon name={active.icon} className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold tracking-tight">{active.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{active.plan}</span>
          </span>
          <Icon name="chevrons-up-down" className="h-4 w-4 shrink-0 text-muted-foreground" />
        </span>
      }
    >
      {(close) => {
        if (mode === "rename" && manage) {
          return (
            <form
              className="p-1"
              onSubmit={(e) => {
                e.preventDefault();
                const next = name.trim();
                if (next) void run(() => manage.onRename(active.id, next), close);
              }}
            >
              <p className="px-1.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Rename workspace
              </p>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Workspace name"
                className="field"
              />
              <div className="mt-2 flex gap-1.5">
                <button type="button" onClick={resetMode} className="btn-ghost flex-1 py-1.5">
                  Cancel
                </button>
                <button type="submit" disabled={busy || !name.trim()} className="btn-primary flex-1 py-1.5">
                  Save
                </button>
              </div>
            </form>
          );
        }

        if (mode === "confirm" && manage) {
          const next = workspaces.find((w) => w.id !== active.id);
          return (
            <div className="p-1">
              <p className="px-1.5 py-2 text-sm">
                Delete <span className="font-medium">{active.name}</span>? This can&apos;t be undone.
              </p>
              <div className="mt-1 flex gap-1.5">
                <button type="button" onClick={resetMode} className="btn-ghost flex-1 py-1.5">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(() => manage.onDelete(active.id), () => {
                      if (next) onChange(next.id);
                      close();
                    })
                  }
                  className="flex-1 rounded-lg bg-destructive px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        }

        return (
          <>
            <p className="px-2.5 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Workspaces
            </p>
            {workspaces.map((w) => (
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
                {w.id === activeId && <Icon name="check" className="h-4 w-4 shrink-0 text-accent" />}
              </DropdownItem>
            ))}
            <DropdownDivider />
            <DropdownItem
              disabled={!manage || busy}
              onClick={() => {
                if (manage) void run(() => manage.onCreate().then(onChange), close);
              }}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border">
                <Icon name="plus" className="h-3.5 w-3.5" />
              </span>
              <span>Add workspace</span>
            </DropdownItem>
            {manage && (
              <>
                <DropdownItem
                  onClick={() => {
                    setName(active.name);
                    setMode("rename");
                  }}
                >
                  <Icon name="pencil" className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">Rename “{active.name}”</span>
                </DropdownItem>
                <DropdownItem
                  destructive
                  disabled={workspaces.length <= 1}
                  onClick={() => setMode("confirm")}
                >
                  <Icon name="trash" className="h-4 w-4" />
                  <span className="truncate">Delete “{active.name}”</span>
                </DropdownItem>
              </>
            )}
          </>
        );
      }}
    </Dropdown>
  );
}
