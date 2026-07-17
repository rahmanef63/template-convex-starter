"use client";

// Minimal accessible disclosure popover — built ONCE, reused by the workspace
// switcher, nav-user, and theme picker (DRY). No radix/headless dep: a trigger
// <button> with aria-expanded + aria-controls and a labelled panel of plain
// buttons. It's a disclosure, not an ARIA menu — we don't implement arrow-key
// roving focus, so we don't claim role="menu". Outside-click + Escape close;
// Escape and item activation return focus to the trigger. `side` flips the panel
// up (footer nav-user) or down (header/topbar); `align` pins the start/end edge.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Dropdown({
  trigger,
  children,
  label,
  side = "bottom",
  align = "start",
  onClose,
}: {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  label: string;
  side?: "top" | "bottom";
  align?: "start" | "end";
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const skipRefocus = useRef(false); // set when an outside click closed us
  const menuId = useId();
  const close = () => setOpen(false); // plain — the focus-return effect handles the rest

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        skipRefocus.current = true; // let focus follow the click, don't yank it back
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  // On close (Escape or item activation) return focus to the trigger — the
  // menu-button contract — unless an outside click already moved it. Reading the
  // ref here (an effect) is fine; reading it during render is not.
  useEffect(() => {
    if (wasOpen.current && !open) {
      if (!skipRefocus.current) triggerRef.current?.focus();
      onClose?.();
    }
    skipRefocus.current = false;
    wasOpen.current = open;
  }, [open, onClose]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="w-full"
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          role="group"
          aria-label={label}
          className={cn(
            "absolute z-50 min-w-[14rem] rounded-xl border border-border bg-card p-1.5 shadow-lg",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

// A row: a real <button> reached by Tab. `destructive` is a named variant (not a
// raw class override) so its colors don't collide with the base palette — we have
// no tailwind-merge to dedupe utilities.
export function DropdownItem({
  onClick,
  disabled,
  destructive,
  className,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
        disabled
          ? "cursor-default text-muted-foreground"
          : destructive
            ? "text-destructive hover:bg-destructive/10"
            : "text-foreground hover:bg-card-hover",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div role="separator" className="my-1 h-px bg-border" />;
}
