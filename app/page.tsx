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
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
      <section>
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
          {IS_DEMO ? (
            <a href={CLONE_URL} target="_blank" rel="noreferrer" className="btn-primary">
              Clone this project ↗
            </a>
          ) : (
            <Link href="/login" className="btn-primary">
              Get started
            </Link>
          )}
          <Link href={IS_DEMO ? "/login" : "/dashboard"} className="btn-ghost">
            {IS_DEMO ? "Try the demo" : "Go to dashboard"}
          </Link>
        </div>
      </section>

      <section className="card mt-16 divide-y divide-border">
        {features.map((f, i) => (
          <div key={f.title} className="flex items-start gap-5 p-5">
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
    </main>
  );
}
