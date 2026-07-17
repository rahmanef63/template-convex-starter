"use client";

// Signed-in path: the OS shell backed by real Convex workspaces. Reads the user's
// workspaces, seeds the placeholder set on first visit (idempotent), then renders
// the SAME OsShell the logged-out demo uses — only the data source differs.
import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WORKSPACES } from "@/components/os/menu";
import { OsShell } from "./os-shell";
import { ShellSkeleton } from "./shell-skeleton";

export function OsShellConvex() {
  const workspaces = useQuery(api.workspaces.list);
  const ensureSeeded = useMutation(api.workspaces.ensureSeeded);

  // First visit → the user has no workspaces yet, so seed the defaults once. The
  // mutation is idempotent (no-op if any exist), so a re-run or race is harmless.
  useEffect(() => {
    if (workspaces && workspaces.length === 0) {
      void ensureSeeded({
        workspaces: WORKSPACES.map(({ name, plan, icon, features }) => ({
          name,
          plan,
          icon,
          features,
        })),
      });
    }
  }, [workspaces, ensureSeeded]);

  // Loading, or the brief window while the first-visit seed is in flight.
  if (workspaces === undefined || workspaces.length === 0) return <ShellSkeleton />;

  return (
    <OsShell
      workspaces={workspaces.map((w) => ({
        id: w._id,
        name: w.name,
        plan: w.plan,
        icon: w.icon,
        features: w.features,
      }))}
    />
  );
}
