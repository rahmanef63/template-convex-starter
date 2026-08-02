"use client";

// Mobile "all apps" bottom sheet (hidden on md+): a slide-up panel gridding the
// active workspace's features, with the account menu pinned under them — the aside
// (and its NavUser footer) is hidden below md, so this is a phone's only route to
// sign in / sign out. A native <dialog> opened with showModal(), so the
// platform supplies the top layer, the inert background, Escape-to-close, the
// focus trap, focus restore, and the ::backdrop scrim — none of that is hand-rolled
// here. Only the scroll lock is ours (see below). Layout: a dialog centres itself,
// so mt-auto + w-full/max-w-none pin it to the bottom edge, and display comes from
// `max-md:open:flex` — plain `open:flex` outranks `md:hidden` and would leak onto
// desktop, while closed it falls through to the UA's display:none. `text-foreground`
// is not decoration: the UA gives dialogs `color: canvastext`, which ignores our theme.
import { useEffect, useRef } from "react";
import { type MenuItem } from "./menu";
import { Icon } from "./icons";
import { NavUser } from "./nav-user";
import { cn } from "@/lib/cn";

export function MoreSheet({
  open,
  onClose,
  project,
  system,
  active,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  project: MenuItem[];
  system: MenuItem[];
  active: string;
  onSelect: (slug: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // The dialog is always mounted so the ref exists the moment `open` flips.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    // A modal dialog inerts the background but does NOT stop it scrolling — the
    // one piece of modal behaviour the platform still leaves to us.
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const pick = (slug: string) => {
    onSelect(slug);
    onClose();
  };

  return (
    <dialog
      ref={ref}
      aria-label="All apps"
      onClose={onClose}
      // A backdrop click lands on the dialog box itself; anything inside it doesn't.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 mt-auto max-h-[85dvh] w-full max-w-none flex-col rounded-t-2xl border-t border-border bg-card text-foreground pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop:bg-black/50 backdrop:backdrop-blur-sm max-md:open:flex md:hidden"
    >
      <div className="mx-auto mt-3 h-1 w-9 shrink-0 rounded-full bg-border" />
      <div className="px-5 pt-3 pb-4">
        <h2 className="text-lg font-semibold tracking-tight">All features</h2>
        <p className="text-sm text-muted-foreground">Placeholder — project features + system.</p>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-2">
        <SheetGroup label="Project" items={project} active={active} onSelect={pick} />
        <SheetGroup label="System" items={system} active={active} onSelect={pick} />
      </div>
      {/* Same component the sidebar footer uses, so all three auth states stay in one place. */}
      <div className="mt-3 shrink-0 border-t border-border px-4 pt-3">
        <NavUser />
      </div>
    </dialog>
  );
}

function SheetGroup({
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
    <div>
      <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="grid grid-cols-4 gap-x-2 gap-y-4">
        {items.map((item) => (
          <SheetItem key={item.slug} item={item} active={item.slug === active} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function SheetItem({
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
      className="flex flex-col items-center gap-1.5"
    >
      <span
        className={cn(
          "grid h-14 w-14 place-items-center rounded-2xl border shadow-sm transition-transform motion-safe:active:scale-95",
          active
            ? "border-accent/50 bg-accent/12 text-accent"
            : "border-border bg-card-hover text-foreground",
        )}
      >
        <Icon name={item.icon} className="h-6 w-6" />
      </span>
      <span className="line-clamp-2 min-h-[2rem] text-center text-[11px] font-medium text-foreground/85">
        {item.label}
      </span>
    </button>
  );
}
