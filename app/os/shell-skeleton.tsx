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
      <main className="min-w-0 flex-1 bg-card/25 md:bg-background md:p-7">
        <div className="border-b border-border bg-background px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:border-0 md:p-0">
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="px-4 pt-5 md:px-0 md:pt-8">
          <div className="-mx-4 min-h-[calc(100dvh-10rem)] rounded-t-[1.75rem] border-t border-border bg-background px-4 py-5 md:mx-0 md:min-h-0 md:rounded-none md:border-0 md:bg-transparent md:p-0">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
