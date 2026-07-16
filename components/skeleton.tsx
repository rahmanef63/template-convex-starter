// Loading placeholder that mirrors the shape of the content it stands in for.
// Size it with width/height utilities at the call site.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}
