"use client";

// Placeholder OS shell — a static template to build real screens on. No Convex,
// no auth, no routing: a single `active` slug in state drives the sidebar, dock,
// topbar title, and the shared placeholder dashboard body below. As you build an
// app out, swap the placeholder tiles/rows for real <Authenticated> useQuery data.
import { useState } from "react";
import { MENU, MENU_BY_SLUG, FAB, type MenuItem } from "@/components/os/menu";
import { Icon } from "@/components/os/icons";
import { OsDock } from "@/components/os/os-dock";
import { MoreSheet } from "@/components/os/more-sheet";
import { cn } from "@/lib/cn";

export function OsShell() {
  const [active, setActive] = useState(MENU[0]?.slug ?? FAB.slug);
  const [moreOpen, setMoreOpen] = useState(false);
  const app = MENU_BY_SLUG[active] ?? FAB;

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/40 p-4 md:flex">
        <div className="flex items-center gap-2 px-2 pb-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Icon name="sparkle" className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            STARTER <span className="text-accent">OS</span>
          </span>
        </div>
        <nav aria-label="Apps" className="flex flex-col gap-0.5">
          {MENU.map((item) => {
            const isActive = item.slug === active;
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => setActive(item.slug)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/12 text-foreground"
                    : "text-muted-foreground hover:bg-card-hover hover:text-foreground",
                )}
              >
                <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", isActive && "text-accent")}>
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-7">
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 pb-6">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-widest text-accent">Workspace</p>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{app.label}</h1>
            <p className="truncate text-sm text-muted-foreground">{app.sub}</p>
          </div>
          <button type="button" className="btn-ghost" aria-label="Search (placeholder)">
            <Icon name="search" className="h-4 w-4" />
            <span>Search</span>
            <kbd className="hidden rounded border border-border px-1 text-[10px] sm:inline">⌘K</kbd>
          </button>
        </header>

        <DashboardScreen app={app} />

        <div className="h-[calc(6rem+env(safe-area-inset-bottom))] md:hidden" />
      </main>

      <OsDock active={active} onSelect={setActive} onOpenMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} active={active} onSelect={setActive} />
    </div>
  );
}

// Shared placeholder body — every app renders the same stat tiles + list for now.
// This is the seam: give each app its own screen (or feed real data in) as you go.
function DashboardScreen({ app }: { app: MenuItem }) {
  const tiles = ["Total", "Active", "Pending", "Archived"];
  const rows = ["Placeholder row one", "Placeholder row two", "Placeholder row three"];
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t} className="card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">—</p>
            <p className="mt-1 text-xs text-muted-foreground">Placeholder metric</p>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-sm font-semibold">{app.label} — recent</h2>
          <span className="text-xs text-muted-foreground">Placeholder</span>
        </div>
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r} className="flex items-center gap-3 py-3">
              <span className="h-8 w-8 shrink-0 rounded-lg bg-card-hover" />
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{r}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Sample content — replace with a real query
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
