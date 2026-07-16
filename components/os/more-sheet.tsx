"use client";

// Mobile "all apps" bottom sheet (hidden on md+). Placeholder overlay drawer:
// a scrim + a slide-up panel with an app grid, all from the MENU SSOT. No modal
// library — a fixed overlay with the modal basics done by hand: Escape-to-close,
// body scroll lock, and real focus management (focus in on open, trap Tab within
// the dialog, restore to the trigger on close) so aria-modal is an honest claim.
import { useEffect, useRef } from "react";
import { MENU } from "./menu";
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
          <h2 className="text-lg font-semibold tracking-tight">All apps</h2>
          <p className="text-sm text-muted-foreground">Placeholder — every app in the shell.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
          <div className="grid grid-cols-4 gap-x-2 gap-y-4">
            {MENU.map((item) => {
              const isActive = item.slug === active;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => {
                    onSelect(item.slug);
                    onClose();
                  }}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "grid h-14 w-14 place-items-center rounded-2xl border shadow-sm transition-transform motion-safe:active:scale-95",
                      isActive
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
