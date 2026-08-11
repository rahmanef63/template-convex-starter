# convex-starter

Minimal **Convex + Next.js 16** starter. Deploy to Vercel; Convex auto-deploys on every build. **You only set 4 env vars.**

**Live demo:** https://template-convex-starter.vercel.app

## The 4 variables

| Your term    | Env var                  | Where             | e.g.                          |
| ------------ | ------------------------ | ----------------- | ----------------------------- |
| cloud        | `NEXT_PUBLIC_CONVEX_URL` | **Set in Vercel** | `https://abc-123.convex.cloud` |
| deploy key   | `CONVEX_DEPLOY_KEY`      | **Set in Vercel** | `prod:abc...` (Convex Deploy Keys) |
| site         | `CONVEX_SITE_URL`        | Auto              | `https://abc-123.convex.site`  |
| domain       | `SITE_URL`               | Auto              | `https://your-app.vercel.app`  |

Set **cloud** + **deploy key** yourself in Vercel. **site** + **domain** are auto (Convex Cloud provides `site`; `domain` is derived from `VERCEL_URL` by `scripts/setup-auth.mjs`).

Three more are **optional**, and the app runs without them: `ANTHROPIC_API_KEY`
(in Vercel) turns the assistant on; `RESEND_API_KEY` + `AUTH_EMAIL_FROM` turn
password reset on and go on the **Convex deployment**, not Vercel — see
`.env.example`, which documents where each one is set.

## Deploy to Vercel

1. **Push this repo** to GitHub and import it into Vercel.
2. **Set the Build Command** to `bun run build:auto` (`vercel.json` already does this; Vercel picks bun up from `bun.lock`). This runs `scripts/build.mjs`, which **gates on `bun run lint` + `bun run test` first** — a red suite aborts the build before anything touches Convex. Then it provisions the auth keys (`scripts/setup-auth.mjs`) and runs `convex deploy --cmd 'next build'`, which pushes your Convex functions + schema and builds Next.js injecting `NEXT_PUBLIC_CONVEX_URL`.
3. **Set env vars** `NEXT_PUBLIC_CONVEX_URL` + `CONVEX_DEPLOY_KEY`, then deploy.

Every git push to your production branch redeploys both Convex and the frontend.

### Preview deploys (PRs)

A PR preview build with a **production** deploy key never runs `convex deploy` —
`scripts/build.mjs` detects `VERCEL_ENV=preview` and builds the frontend only, so
PR code can't overwrite your production backend. To get a real isolated backend
per PR, create a **preview deploy key** (starts with `preview:`) in the Convex
dashboard and set it as `CONVEX_DEPLOY_KEY` for Vercel's *Preview* environment
only.

## Local dev

```bash
bun install
bunx convex dev  # terminal 1 — prompts to create/link a deployment, writes NEXT_PUBLIC_CONVEX_URL
bun run dev      # terminal 2 — http://localhost:3000
bun run check    # typecheck + lint + tests (offline, no deployment needed)
```

The package manager is **bun** — `bun install`, `bun run <script>`, `bunx <cli>`.
There's no npm lockfile; `bun.lock` is the committed one.

`bun run test` runs two Vitest projects in one pass: **backend** (`tests/*.test.ts`,
convex-test — auth, ownership, isolation, rate limits) and **ui**
(`tests/ui/*.test.tsx`, React Testing Library, every suite ending in an automated
axe pass). Always `bun run test`, never bare `bun test` — Bun's own runner ignores
`vitest.config.mts` and breaks on convex-test.

Sign up on `/login` to create your account.

## What's inside

- `/` — landing page
- `/login` — auth (sign up / sign in)
- `/os` — **where you land after signing in**, and the dashboard demo: an adaptive
  OS shell (desktop sidebar + dashboard, mobile bottom dock) with a workspace
  switcher, project/system feature groups, nav-user, collapsible sidebar +
  breadcrumb, and a light/dark theme picker. Public placeholder when logged out;
  signed-in it reads your **workspaces from a Convex table** (per-user, seeded on
  first visit) with full create / rename / delete. Native + Tailwind, no UI-kit
  dependency.

Two entries inside the shell are **live features**, the rest are placeholders you
replace with your own:

- **Notes** — a real per-user Convex table with server-side ownership checks on
  every mutation.
- **Assistant** — Claude-powered AI chat (Vercel AI SDK). Optional — set
  `ANTHROPIC_API_KEY` to turn it on. Sign-in required; `app/api/chat/route.ts`
  verifies the caller's Convex auth token and charges their rate limit before
  calling Claude, so strangers can't spend your API key and one account can't
  drain it either.

Auth is [`@convex-dev/auth`](https://labs.convex.dev/auth) Password provider (open signup), with sign-in/sign-up/reset attempts rate-limited per email address. **Password reset is optional**: it emails a code via Resend, and stays inert (a clear "not configured" error) until you set both vars on the **Convex** deployment — not in Vercel, since the sender runs inside a Convex action: `bunx convex env set RESEND_API_KEY re_xxx` and `bunx convex env set AUTH_EMAIL_FROM "My App <no-reply@yourdomain.com>"`. The deployment also needs `SITE_URL`, which `scripts/setup-auth.mjs` sets during the build. Data is per-user with server-side ownership checks on every mutation — a `notes` table and a `workspaces` table, both surfaced in the `/os` shell and each proven by `tests/*.test.ts`. Theme is light/dark/system via `next-themes` (dark is the default). The AI backend lives in `app/api/chat/route.ts` (Claude via `@ai-sdk/anthropic`); its UI is the Assistant screen inside the shell. Error/loading UX is built in: global error boundary, 404, loading skeletons (`components/skeleton.tsx`), and toasts (`components/toast.tsx`). Deploy is Vercel-only: every push to your production branch triggers a Vercel build that deploys Convex + builds Next together (`build:auto`), and that build **gates on lint + tests before it touches Convex** (`scripts/build.mjs`) while `next build` type-checks — a red suite never reaches your backend, and there's no separate CI service. Run `bun run check` locally. Dependabot keeps deps fresh. Vercel **Web Analytics** + **Speed Insights** are wired in `app/layout.tsx` (both free — enable each in your Vercel project's *Analytics* / *Speed Insights* tab; they no-op until then).

## Vibe-coding guardrails (built in)

This is a **blank canvas you build on with an AI coding tool** — so it ships with
guardrails that keep AI-assisted code clean (no slop, no DRY/SSOT violations, no
spaghetti), even if you've never coded before:

- **`AGENTS.md`** — the single source of truth for how any AI tool (Cursor, Claude
  Code, Copilot, Windsurf) should build here: architecture map, the laziness ladder
  (YAGNI), DRY/SSOT rules, Convex security rules (auth on every mutation, index
  don't scan), no-AI-slop frontend rules, and the add-a-feature golden path.
- **`CHECKLIST.md`** — the single ship checklist: SEO, performance, security,
  accessibility, data, UX states, testing, deploy. Boxes already ticked name the
  file that keeps them true; the rest are the per-app work you do. `AGENTS.md`
  says *how* to build, `CHECKLIST.md` says *what must be true* when you're done.
- **`CLAUDE.md`** and **`.cursor/rules/`** just point at those two — one source,
  no drift.
- **`.claude/skills/add-feature`** — a Claude Code skill that walks the clean
  schema → validated+authz'd function → typed UI path when you ask it to add a feature.
- **`.claude/skills/ship-check`** — runs the checklist for you: the gate
  (`bun run check`, `bun run build`), then greps for the violations that block a
  ship (mutation without `requireUser`, `.filter()` scans, a secret behind
  `NEXT_PUBLIC_`), and reports what's red.

Just open the repo in your AI tool and start describing what you want — it reads
these rules automatically.

## Production defaults (already wired)

The boilerplate you'd otherwise bolt on at the end:

| | Where |
| --- | --- |
| Security headers (nosniff, frame-deny, referrer, permissions, HSTS), no `x-powered-by` | `next.config.ts` |
| Social preview image, generated at build time | `app/opengraph-image.tsx` |
| Canonical URL, Open Graph, Twitter card, theme color | `app/layout.tsx` |
| `robots.txt`, `sitemap.xml`, web app manifest | `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts` |
| Site name / copy / brand colors, one home | `lib/site.ts` |
| Rate limits that survive scaling — the counter is a Convex row, not a Map in one serverless instance: 20 chat calls/min per user, 10 credential attempts/10 min per email address, 3 reset requests/15 min | `convex/_shared/rateLimit.ts`, `convex/users.ts` → `beginChat`, `convex/auth.ts` → `throttleCredentials` |
| Password reset by emailed code (15-min TTL, single use) — **optional**: inert with a clear "not configured" error until you set the two Resend vars | `convex/auth.ts`, `convex/_shared/email.ts` |
| Auth + ownership helpers (a missing row and someone else's row look identical) | `convex/_shared/auth.ts` |
| Every read the template ships is bounded — `.take(MAX_*)`, never `.collect()` on a growing table | `convex/notes.ts`, `convex/workspaces.ts` |
| Global error boundary, 404, skeletons, toasts | `app/error.tsx`, `app/not-found.tsx`, `components/` |
| Server errors logged as one JSON line carrying the `digest` — the reference code the error page shows the user is greppable in Vercel's runtime logs. Headers, cookies and the query string are never logged | `instrumentation.ts` |
| The deploy gate: `bun run lint` + `bun run test` run *before* `convex deploy`, so a red suite leaves the backend untouched | `scripts/build.mjs` |
| Two test projects, one command — backend (convex-test) + component (RTL + axe) | `vitest.config.mts`, `tests/`, `tests/ui/` |

## Updating your clone

A fork stops receiving upstream commits the moment you create it. Two things
close that gap:

**In the app** — `/os` → **Settings** shows a *Version & updates* card: the
version you're running (`version.json`), whether the template published a newer
one, and a **Rebuild site** button. Optional, both set on the **Convex**
deployment:

```bash
bunx convex env set VERCEL_DEPLOY_HOOK_URL "https://api.vercel.com/v1/integrations/deploy/…"
bunx convex env set OWNER_EMAIL "you@example.com"
```

The hook comes from Vercel → Project → Settings → Git → Deploy Hooks. **Set
`OWNER_EMAIL` once your site is public**: signup is open, so without it any
signed-up stranger can spend your build minutes. A global cap of 3 rebuilds/hour
applies either way, and the card never ships a git token — it re-deploys, it
does not push code.

**In your terminal** — the code itself comes down over git:

```bash
bun run update:template     # adds the template remote, shows what's new
git merge template/main     # you decide; expect conflicts where you edited
bun install && bun run check
git push                    # Vercel rebuilds, Convex deploys with it
```

`bun run update:template` refuses to run on a dirty tree and never merges for
you — merging into code you've since changed is a decision, not a chore.

Bump `version.json` in the same commit whenever you cut a release of your own.

## Known limits (read before you rely on any of this)

None of these are bugs to file — they're the edges of what the template claims.
`CHECKLIST.md` carries each one as an unchecked box with how to close it.

- **No Content-Security-Policy.** It needs per-request nonces, so it belongs to
  your app, not the template. `CHECKLIST.md` → Security says how.
- **Auth throttling is per email address only.** A Convex action can't see the
  caller's IP, so credential stuffing spread thin across many distinct addresses
  isn't caught. Per-IP limiting has to happen in front of the app (your CDN/WAF).
- **Email case is not normalized for account identity.** `Bob@x.com` and
  `bob@x.com` create two accounts. (The rate-limit key *is* lowercased, so case
  variants do share one bucket.) Fixing it needs a backfill, so the template
  leaves your data alone.
- **A failed reset send looks the same as an unknown address.** The reset form
  always answers "if that address has an account, a code is on its way" — that's
  what keeps it from confirming who has an account, but it also hides a genuine
  failure (Resend down, or `SITE_URL` missing on the Convex deployment). If a
  user says no code arrived, check the Convex logs.
- **The auth throttle wraps a `@convex-dev/auth` internal** (the Password
  provider's `.options.authorize`, pinned at 0.0.94). If a version bump moves it,
  `convex/auth.ts` throws at deploy time on purpose rather than silently dropping
  the limit — read the comment there before upgrading.
- **`instrumentation.ts` only sees server-side errors.** A digest generated by a
  client-side render error never reaches it, so that digest isn't in the logs.
- **`tests/ui/` runs in jsdom**, which has no layout engine and a stub
  `<dialog>`: color contrast and real modal behavior (focus trap, Esc, focus
  restore) are browser checks, not test checks. Components that need Convex/auth
  providers (`nav-user`, `notes-screen`, `assistant-screen`, the `/os` shell)
  have no automated axe pass yet.
- **Signed-in flows can't be exercised offline.** convex-test is an in-memory
  simulation; sign-up, reset, and a real write still need a browser against a
  live deployment.
