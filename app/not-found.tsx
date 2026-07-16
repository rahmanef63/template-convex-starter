import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">404</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That page does not exist or has moved.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Back home
        </Link>
      </div>
    </main>
  );
}
