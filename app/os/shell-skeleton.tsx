import { Skeleton } from "@/components/skeleton";

// Full-shell loading state — shown while auth resolves or workspaces seed/load.
export function ShellSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading workspace"
      className="flex h-dvh overflow-hidden bg-background"
    >
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/40 p-4 md:flex">
        <Skeleton className="h-11 w-full rounded-lg" />
        <div className="mt-6 space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="mt-auto h-12 w-full rounded-lg" />
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-7">
        <Skeleton className="h-8 w-40" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
