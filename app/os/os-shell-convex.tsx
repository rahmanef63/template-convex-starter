"use client";

// Signed-in path: the OS shell backed by real Convex workspaces. Reads the user's
// workspaces, seeds the placeholder set on first visit (idempotent), then renders
// the SAME OsShell the logged-out demo uses — only the data source differs.
import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { WORKSPACES } from "@/components/os/menu";
import { type WorkspaceManage } from "@/components/os/workspace-switcher";
import { useToast } from "@/components/toast";
import { errorMessage } from "@/lib/errors";
import { OsShell } from "./os-shell";
import { ShellSkeleton } from "./shell-skeleton";

export function OsShellConvex() {
  const workspaces = useQuery(api.workspaces.list);
  const ensureSeeded = useMutation(api.workspaces.ensureSeeded);
  const create = useMutation(api.workspaces.create);
  const rename = useMutation(api.workspaces.rename);
  const remove = useMutation(api.workspaces.remove);
  const toast = useToast();

  // One failure contract for every write: surface the ConvexError message as a
  // toast, then rethrow so the switcher leaves its current view open.
  const wrap =
    <A extends unknown[], R>(fn: (...a: A) => Promise<R>) =>
    async (...a: A) => {
      try {
        return await fn(...a);
      } catch (e) {
        toast(errorMessage(e), { variant: "error" });
        throw e;
      }
    };

  // CRUD handlers passed to the switcher. Rename/delete swallow the mutation's
  // return so they match the switcher's `Promise<void>` contract.
  const manage: WorkspaceManage = {
    onCreate: wrap(() => create({ name: "New workspace" })),
    onRename: wrap(async (id: string, name: string) => {
      await rename({ id: id as Id<"workspaces">, name });
    }),
    onDelete: wrap(async (id: string) => {
      await remove({ id: id as Id<"workspaces"> });
    }),
  };

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
      manage={manage}
    />
  );
}
