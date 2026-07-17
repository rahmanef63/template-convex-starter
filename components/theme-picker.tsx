"use client";

// Theme dropdown (Light / Dark / System) over next-themes. The one fully-wired
// feature. Uses the shared Dropdown primitive. Guards hydration: next-themes
// only knows the resolved theme after mount, so until then we render a stable
// icon-only placeholder that matches the server output (no mismatch, no flash).
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Icon } from "@/components/os/icons";
import { Dropdown, DropdownItem } from "@/components/os/dropdown";
import { cn } from "@/lib/cn";

const OPTIONS = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "System", icon: "monitor" },
] as const;

export function ThemePicker() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  // Flip once after hydration so the trigger reflects the real resolved theme.
  // This is the documented next-themes guard, not app state syncing — the
  // one-time render is intentional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Stable placeholder before hydration — same markup shape, neutral icon.
  if (!mounted) {
    return (
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground"
      >
        <Icon name="sun" className="h-4 w-4" />
      </span>
    );
  }

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[1];

  return (
    <Dropdown
      label="Change theme"
      align="end"
      trigger={
        <span className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-border-hover hover:text-foreground">
          <Icon name={current.icon} className="h-4 w-4" />
        </span>
      }
    >
      {(close) =>
        OPTIONS.map((o) => {
          const active = o.value === theme;
          return (
            <DropdownItem
              key={o.value}
              onClick={() => {
                setTheme(o.value);
                close();
              }}
            >
              <Icon
                name={o.icon}
                className={cn("h-4 w-4", active ? "text-accent" : "text-muted-foreground")}
              />
              <span className="flex-1">{o.label}</span>
              {active && <Icon name="check" className="h-4 w-4 text-accent" />}
            </DropdownItem>
          );
        })
      }
    </Dropdown>
  );
}
