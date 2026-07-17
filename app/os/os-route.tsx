"use client";

// /os entry. The OS shell is a public demo: logged-out (or while auth resolves) it
// renders the in-code placeholder workspaces; signed-in it renders the Convex-
// backed shell (per-user workspaces, seeded on first visit, switching persists).
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { WORKSPACES } from "@/components/os/menu";
import { OsShell } from "./os-shell";
import { OsShellConvex } from "./os-shell-convex";
import { ShellSkeleton } from "./shell-skeleton";

export function OsRoute() {
  return (
    <>
      <AuthLoading>
        <ShellSkeleton />
      </AuthLoading>
      <Unauthenticated>
        <OsShell workspaces={WORKSPACES} />
      </Unauthenticated>
      <Authenticated>
        <OsShellConvex />
      </Authenticated>
    </>
  );
}
