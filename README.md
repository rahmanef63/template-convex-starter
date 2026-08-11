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

## Deploy to Vercel

1. **Push this repo** to GitHub and import it into Vercel.
2. **Set the Build Command** to `bun run build:auto` (`vercel.json` already does this; Vercel picks bun up from `bun.lock`). This runs `scripts/build.mjs` — it provisions the auth keys (`scripts/setup-auth.mjs`), then `convex deploy --cmd 'next build'` pushes your Convex functions + schema and builds Next.js injecting `NEXT_PUBLIC_CONVEX_URL`.
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
bun run check    # typecheck + lint + backend tests (offline, no deployment needed)
```

The package manager is **bun** — `bun install`, `bun run <script>`, `bunx <cli>`.
There's no npm lockfile; `bun.lock` is the committed one.

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
  verifies the caller's Convex auth token so strangers can't spend your API key.

Auth is [`@convex-dev/auth`](https://labs.convex.dev/auth) Password provider (open signup). Data is per-user with server-side ownership checks on every mutation — a `notes` table and a `workspaces` table, both surfaced in the `/os` shell and each proven by `tests/*.test.ts`. Theme is light/dark/system via `next-themes` (dark is the default). The AI backend lives in `app/api/chat/route.ts` (Claude via `@ai-sdk/anthropic`); its UI is the Assistant screen inside the shell. Error/loading UX is built in: global error boundary, 404, loading skeletons (`components/skeleton.tsx`), and toasts (`components/toast.tsx`). Deploy is Vercel-only: every push to your production branch triggers a Vercel build that deploys Convex + builds Next together (`build:auto`), and `next build` type-checks + lints — no separate CI service. Run `bun run check` locally. Dependabot keeps deps fresh. Vercel **Web Analytics** + **Speed Insights** are wired in `app/layout.tsx` (both free — enable each in your Vercel project's *Analytics* / *Speed Insights* tab; they no-op until then).

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
| Per-user rate limit on the AI route | `app/api/chat/route.ts` |
| Auth + ownership helpers (a missing row and someone else's row look identical) | `convex/_shared/auth.ts` |
| Global error boundary, 404, skeletons, toasts | `app/error.tsx`, `app/not-found.tsx`, `components/` |

Adding a Content-Security-Policy is the one hardening step left deliberately
undone — it needs per-request nonces, so it belongs to your app, not the
template. `CHECKLIST.md` → Security says how.
