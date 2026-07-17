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
2. **Set the Build Command** to `npm run build:auto`. This runs `scripts/build.mjs` — it provisions the auth keys (`scripts/setup-auth.mjs`), then `convex deploy --cmd 'next build'` pushes your Convex functions + schema and builds Next.js injecting `NEXT_PUBLIC_CONVEX_URL`.
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
npm install
npx convex dev   # terminal 1 — prompts to create/link a deployment, writes NEXT_PUBLIC_CONVEX_URL
npm run dev      # terminal 2 — http://localhost:3000
npm test         # backend tests (Vitest + convex-test, no deployment needed)
```

Sign up on `/login` to create your account.

## What's inside

- `/` — landing page
- `/login` — auth (sign up / sign in)
- `/dashboard` — your notes, live via Convex
- `/assistant` — Claude-powered AI chat (Vercel AI SDK). Optional — set `ANTHROPIC_API_KEY` to turn it on. Sign-in required; the route verifies the caller's Convex auth token so strangers can't spend your API key.

Auth is [`@convex-dev/auth`](https://labs.convex.dev/auth) Password provider (open signup). Data is a `notes` table, per-user, with server-side ownership checks on every mutation — and `tests/notes.test.ts` proves those checks hold. The AI route lives in `app/api/chat/route.ts` (Claude via `@ai-sdk/anthropic`). Error/loading UX is built in: global error boundary, 404, loading skeletons (`components/skeleton.tsx`), and toasts (`components/toast.tsx`). Deploy is Vercel-only: every push to your production branch triggers a Vercel build that deploys Convex + builds Next together (`build:auto`), and `next build` type-checks + lints — no separate CI service. Run `npm test` locally. Dependabot keeps deps fresh. Vercel **Web Analytics** + **Speed Insights** are wired in `app/layout.tsx` (both free — enable each in your Vercel project's *Analytics* / *Speed Insights* tab; they no-op until then).

## Vibe-coding guardrails (built in)

This is a **blank canvas you build on with an AI coding tool** — so it ships with
guardrails that keep AI-assisted code clean (no slop, no DRY/SSOT violations, no
spaghetti), even if you've never coded before:

- **`AGENTS.md`** — the single source of truth for how any AI tool (Cursor, Claude
  Code, Copilot, Windsurf) should build here: architecture map, the laziness ladder
  (YAGNI), DRY/SSOT rules, Convex security rules (auth on every mutation, index
  don't scan), no-AI-slop frontend rules, and the add-a-feature golden path.
- **`CLAUDE.md`** and **`.cursor/rules/`** just point at `AGENTS.md` — one source,
  no drift.
- **`.claude/skills/add-feature`** — a Claude Code skill that walks the clean
  schema → validated+authz'd function → typed UI path when you ask it to add a feature.

Just open the repo in your AI tool and start describing what you want — it reads
these rules automatically.
