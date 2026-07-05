import Link from "next/link";

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
        <span className="inline-block rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-500 dark:border-neutral-800">
          Next.js 16 + Convex
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          Convex Starter
        </h1>
        <p className="mt-4 max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
          Next.js + Convex, wired and ready. Set 4 env vars, deploy to Vercel, ship.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-neutral-900"
          >
            Get started
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-neutral-600 transition hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
          >
            Go to dashboard →
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"
          >
            <h2 className="text-sm font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
