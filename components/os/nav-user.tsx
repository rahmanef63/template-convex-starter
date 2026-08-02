"use client";

// Sidebar FOOTER — pinned to the bottom of the aside. Account menu over the
// shared Dropdown, opening UPWARD (side="top") so it clears the bottom edge.
// /os is a public logged-out demo as well as the signed-in home, so all three
// states of api.users.me are real: loading, signed out (a Sign in link, no
// menu), signed in (the real user + a Log out that actually signs out).
// Account / Billing / Notifications stay inert — the menu shape to fill in.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/skeleton";
import { Icon } from "./icons";
import { Dropdown, DropdownItem, DropdownDivider } from "./dropdown";

const ITEMS = [
  { label: "Account", icon: "user" },
  { label: "Billing", icon: "card" },
  { label: "Notifications", icon: "more" },
] as const;

// First letters of the first two words of the name, else the email's first
// character. Password sign-up collects no name, so the email path is the norm.
function initials(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const src = words.length ? words.map((w) => w[0]).join("") : email.slice(0, 1);
  return src.toUpperCase() || "?";
}

// Avatar + name/email, shown in both the trigger and the open-menu header.
// Solid `bg-accent` (not a /12 tint) so the initials pass contrast in light mode.
function UserChip({ name, email }: { name: string; email: string }) {
  return (
    <>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-sm font-semibold text-accent-foreground">
        {initials(name, email)}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-medium">{name || email}</span>
        {name && <span className="block truncate text-xs text-muted-foreground">{email}</span>}
      </span>
    </>
  );
}

export function NavUser() {
  const user = useQuery(api.users.me);
  const { signOut } = useAuthActions();
  const router = useRouter();

  if (user === undefined) return <Skeleton className="h-12 w-full rounded-lg" />;
  if (user === null)
    return (
      <Link href="/login" className="btn-ghost w-full">
        Sign in
      </Link>
    );

  const chip = { name: user.name ?? "", email: user.email ?? "" };

  return (
    <Dropdown
      label="Account menu"
      side="top"
      trigger={
        <span className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-card-hover">
          <UserChip {...chip} />
          <Icon name="chevrons-up-down" className="h-4 w-4 shrink-0 text-muted-foreground" />
        </span>
      }
    >
      {(close) => (
        <>
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <UserChip {...chip} />
          </div>
          <DropdownDivider />
          {ITEMS.map((it) => (
            <DropdownItem key={it.label} onClick={close}>
              <Icon name={it.icon} className="h-4 w-4 text-muted-foreground" />
              <span>{it.label}</span>
            </DropdownItem>
          ))}
          <DropdownDivider />
          <DropdownItem
            destructive
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
          >
            <Icon name="logout" className="h-4 w-4" />
            <span>Log out</span>
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}
