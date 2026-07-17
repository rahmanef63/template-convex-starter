"use client";

// Placeholder OS shell — a static template to build real screens on. No Convex,
// no auth, no routing: a single `active` slug in state drives the sidebar, dock,
// topbar title, and the placeholder body. Two kinds of feature (see menu.ts):
// project features render the dashboard, system features render settings — so the
// difference is visible. Swap the placeholder screens for real <Authenticated>
// useQuery data as you build each feature out.
import { useState } from "react";
import Link from "next/link";
import {
  PROJECT_FEATURES,
  SYSTEM_FEATURES,
  MENU_BY_SLUG,
  FAB,
  type MenuItem,
} from "@/components/os/menu";
import { Icon } from "@/components/os/icons";
import { DashboardScreen, SettingsScreen } from "@/components/os/screens";
import { OsDock } from "@/components/os/os-dock";
import { MoreSheet } from "@/components/os/more-sheet";
import { cn } from "@/lib/cn";

export function OsShell() {
  const [active, setActive] = useState(PROJECT_FEATURES[0]?.slug ?? FAB.slug);
  const [moreOpen, setMoreOpen] = useState(false);
  const app = MENU_BY_SLUG[active] ?? FAB;
  const isSystem = app.group === "system";

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/40 p-4 md:flex">
        <Link
          href="/"
          aria-label="Back to home"
          className="mb-5 flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-card-hover"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Icon name="sparkle" className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            STARTER <span className="text-accent">OS</span>
          </span>
        </Link>
        <nav aria-label="Features" className="flex flex-1 flex-col gap-5">
          <NavGroup label="Project" items={PROJECT_FEATURES} active={active} onSelect={setActive} />
          <NavGroup
            label="System"
            items={SYSTEM_FEATURES}
            active={active}
            onSelect={setActive}
            className="mt-auto"
          />
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-7">
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pb-6">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              {isSystem ? "System" : "Workspace"}
            </p>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{app.label}</h1>
            <p className="truncate text-sm text-muted-foreground">{app.sub}</p>
          </div>
          <button type="button" className="btn-ghost" aria-label="Search (placeholder)">
            <Icon name="search" className="h-4 w-4" />
            <span>Search</span>
            <kbd className="hidden rounded border border-border px-1 text-[10px] sm:inline">⌘K</kbd>
          </button>
        </header>

        {isSystem ? <SettingsScreen app={app} /> : <DashboardScreen app={app} />}

        <div className="h-[calc(6rem+env(safe-area-inset-bottom))] md:hidden" />
      </main>

      <OsDock active={active} onSelect={setActive} onOpenMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} active={active} onSelect={setActive} />
    </div>
  );
}

function NavGroup({
  label,
  items,
  active,
  onSelect,
  className,
}: {
  label: string;
  items: MenuItem[];
  active: string;
  onSelect: (slug: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
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
