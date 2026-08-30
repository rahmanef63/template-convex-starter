import type { Metadata } from "next";
import Link from "next/link";
import { IS_DEMO, CLONE_URL } from "@/lib/stage";

const features = [
  {
    title: "Auth included",
    body: "@convex-dev/auth Password provider — sign up, sign in, sessions. No setup.",
  },
  {
    title: "Live data",
    body: "Convex reactive queries. The UI updates the instant your data changes.",
  },
  {
    title: "Auto-deploy",
    body: "Convex functions + schema deploy on every Vercel build. Nothing extra to run.",
  },
  {
    title: "Adaptive UI shell",
    body: "A desktop dashboard + mobile dock placeholder at /os — grouped project & system features, ready to fill in.",
  },
];

// Title and description come from the root layout — they describe this page
// exactly, so copying them here would store one fact twice. The canonical does
// not: the root deliberately declares none (it would leak to every nested
// route), so "/" claims its own.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function Home() {
  return (
    <main className="min-h-dvh w-full px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-7xl flex-col justify-center">
      <section className="w-full">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.06] px-3 py-1 text-xs font-medium text-accent">
          <span className="size-1.5 rounded-full bg-accent" />
          Next.js 16 + Convex
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          Full-stack,
          <br />
          already wired.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          A starter with auth, live data, and deploy done for you. Set 4 env vars,
          push, and ship — no backend to stand up.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/os" className="btn-primary">
            View the dashboard demo →
          </Link>
          {IS_DEMO ? (
            <a href={CLONE_URL} target="_blank" rel="noreferrer" className="btn-ghost">
              Clone this project ↗
            </a>
          ) : (
            <Link href="/login" className="btn-ghost">
              Get started
            </Link>
          )}
        </div>
      </section>

      <section className="card mt-12 grid w-full divide-y divide-border overflow-hidden sm:grid-cols-2 sm:divide-y-0 lg:mt-16">
        {features.map((f, i) => (
          <div key={f.title} className="flex min-w-0 items-start gap-4 border-border p-5 sm:border-b sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 lg:p-6">
            <span className="mt-0.5 font-mono text-xs tracking-widest text-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{f.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          </div>
        ))}
      </section>
      </div>
    </main>
  );
}
