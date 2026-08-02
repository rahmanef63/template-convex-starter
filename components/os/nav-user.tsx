"use client";

// Sidebar FOOTER — pinned to the bottom of the aside. Account menu over the
// shared Dropdown, opening UPWARD (side="top") so it clears the bottom edge.
// All menu items are inert placeholders for now — swap for real @convex-dev/auth
// actions (and the real user from menu.ts USER) when auth lands in the shell.
import { USER } from "./menu";
import { Icon } from "./icons";
import { Dropdown, DropdownItem, DropdownDivider } from "./dropdown";

const ITEMS = [
  { label: "Account", icon: "user" },
  { label: "Billing", icon: "card" },
  { label: "Notifications", icon: "more" },
] as const;

// Avatar + name/email, shown in both the trigger and the open-menu header.
// Solid `bg-accent` (not a /12 tint) so the initials pass contrast in light mode.
function UserChip() {
  return (
    <>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground">
        {USER.initials}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium">{USER.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{USER.email}</span>
      </span>
    </>
  );
}

export function NavUser() {
  return (
    <Dropdown
      label="Account menu"
      side="top"
      trigger={
        <span className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-card-hover">
          <UserChip />
          <Icon name="chevrons-up-down" className="h-4 w-4 shrink-0 text-muted-foreground" />
        </span>
      }
    >
      {(close) => (
        <>
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <UserChip />
          </div>
          <DropdownDivider />
          {ITEMS.map((it) => (
            <DropdownItem key={it.label} onClick={close}>
              <Icon name={it.icon} className="h-4 w-4 text-muted-foreground" />
              <span>{it.label}</span>
            </DropdownItem>
          ))}
          <DropdownDivider />
          <DropdownItem onClick={close} destructive>
            <Icon name="logout" className="h-4 w-4" />
            <span>Log out</span>
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}
