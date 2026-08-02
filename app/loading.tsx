import { Skeleton } from "@/components/skeleton";

// Route-transition fallback (App Router streams this while a page loads).
export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-16">
      <Skeleton className="h-6 w-40" />
      <div className="mt-8 space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    </main>
  );
}
