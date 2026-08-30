"use client";

// Slim top bar inside <main>, above the eyebrow/title header. Left: a desktop-only
// sidebar toggle + an in-app breadcrumb (workspace / group / feature). Right: the
// theme picker + the Search button (moved here from the old header). The trigger
// is desktop-only (mobile is dock-driven, the aside is always hidden < md); the
// breadcrumb and theme picker show on every viewport.
import { type MenuItem } from "./menu";
import { Icon } from "./icons";
import { ThemePicker } from "@/components/theme-picker";

export function Topbar({
  app,
  workspaceName,
  collapsed,
  onToggleSidebar,
}: {
  app: MenuItem;
  workspaceName: string;
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const groupLabel = app.group === "system" ? "System" : "Project";

  return (
    <div className="flex min-h-11 items-center justify-between gap-3 pb-3 md:mb-6 md:border-b md:border-border">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          aria-expanded={!collapsed}
          // The <aside id="os-sidebar"> in app/os/os-shell.tsx — aria-expanded
          // alone never says which element it expands.
          aria-controls="os-sidebar"
          className="hidden size-11 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground md:inline-grid"
        >
          <Icon name="panel-left" className="h-4 w-4" />
        </button>
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            <Crumb>{workspaceName}</Crumb>
            <Sep />
            <Crumb>{groupLabel}</Crumb>
            <Sep />
            <Crumb current>{app.label}</Crumb>
          </ol>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemePicker />
        <button type="button" className="btn-ghost min-h-11 min-w-11 px-3" aria-label="Search (placeholder)">
          <Icon name="search" className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded border border-border px-1 text-[10px] sm:inline">⌘K</kbd>
        </button>
      </div>
    </div>
  );
}

function Crumb({ children, current }: { children: React.ReactNode; current?: boolean }) {
  return (
    <li className="min-w-0">
      <span
        aria-current={current ? "page" : undefined}
        className={
          current
            ? "block truncate font-medium text-foreground"
            : "hidden truncate text-muted-foreground sm:block"
        }
      >
        {children}
      </span>
    </li>
  );
}

function Sep() {
  return (
    <li aria-hidden className="hidden text-muted-foreground/50 sm:block">
      /
    </li>
  );
}
