"use client";

// Mobile "all apps" bottom sheet (hidden on md+). Placeholder overlay drawer:
// a scrim + a slide-up panel with an app grid, all from the MENU SSOT. No modal
// library — a fixed overlay with the modal basics done by hand: Escape-to-close,
// body scroll lock, and real focus management (focus in on open, trap Tab within
// the dialog, restore to the trigger on close) so aria-modal is an honest claim.
import { useEffect, useRef } from "react";
import { PROJECT_FEATURES, SYSTEM_FEATURES, type MenuItem } from "./menu";
import { Icon } from "./icons";
import { cn } from "@/lib/cn";

export function MoreSheet({
  open,
  onClose,
  active,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  active: string;
  onSelect: (slug: string) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const restoreTo = document.activeElement as HTMLElement | null;
    dialog?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const f = dialog.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      const el = document.activeElement;
      if (e.shiftKey && (el === first || el === dialog)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && el === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      restoreTo?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const pick = (slug: string) => {
    onSelect(slug);
    onClose();
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 outline-none md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="All apps"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-border bg-card pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto mt-3 h-1 w-9 shrink-0 rounded-full bg-border" />
        <div className="px-5 pt-3 pb-4">
          <h2 className="text-lg font-semibold tracking-tight">All features</h2>
          <p className="text-sm text-muted-foreground">Placeholder — project features + system.</p>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-2">
          <SheetGroup label="Project" items={PROJECT_FEATURES} active={active} onSelect={pick} />
          <SheetGroup label="System" items={SYSTEM_FEATURES} active={active} onSelect={pick} />
        </div>
      </div>
    </div>
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
