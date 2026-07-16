"use client";

// Mobile bottom dock (hidden on md+). Five slots around a raised center action:
// [tab0][tab1][FAB][tab2][Menu]. Tabs are the first three MENU apps; the FAB is
// the primary "Assistant" action; Menu opens the all-apps sheet. Renders from
// the same MENU SSOT as the desktop sidebar — no separate list to keep in sync.
import { MENU, FAB, type MenuItem } from "./menu";
import { Icon } from "./icons";
import { cn } from "@/lib/cn";

export function OsDock({
  active,
  onSelect,
  onOpenMore,
}: {
  active: string;
  onSelect: (slug: string) => void;
  onOpenMore: () => void;
}) {
  const tabs = MENU.slice(0, 3);
  const fabActive = active === FAB.slug;
  const moreActive = !fabActive && !tabs.some((t) => t.slug === active);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2 md:hidden">
      <nav
        aria-label="App dock"
        className="pointer-events-auto mx-auto grid max-w-md grid-cols-5 items-end rounded-2xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur"
      >
        <Slot item={tabs[0]} activeSlug={active} onSelect={onSelect} />
        <Slot item={tabs[1]} activeSlug={active} onSelect={onSelect} />

        <div className="flex flex-col items-center">
          <button
            type="button"
            aria-label={FAB.label}
            aria-current={fabActive ? "page" : undefined}
            onClick={() => onSelect(FAB.slug)}
            className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg ring-4 ring-background transition-transform motion-safe:active:scale-95"
          >
            <Icon name={FAB.icon} className="h-6 w-6" />
          </button>
          <span
            className={cn(
              "mt-1 text-[10px] font-medium",
              fabActive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {FAB.label}
          </span>
        </div>

        <Slot item={tabs[2]} activeSlug={active} onSelect={onSelect} />

        <button
          type="button"
          aria-label="All apps"
          aria-current={moreActive ? "page" : undefined}
          onClick={onOpenMore}
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors",
            moreActive ? "bg-accent/12 text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon name="more" className={cn("h-6 w-6", moreActive && "text-accent")} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}

// A dock slot: a tab if the item exists, else an empty cell so the grid keeps
// its 5 columns and the FAB stays centered no matter how many apps MENU has.
function Slot({
  item,
  activeSlug,
  onSelect,
}: {
  item: MenuItem | undefined;
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  if (!item) return <span aria-hidden />;
  return <DockTab item={item} active={item.slug === activeSlug} onSelect={onSelect} />;
}

function DockTab({
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
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors",
        active ? "bg-accent/12 text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon name={item.icon} className={cn("h-6 w-6", active && "text-accent")} />
      <span className="max-w-full truncate">{item.label}</span>
    </button>
  );
}
