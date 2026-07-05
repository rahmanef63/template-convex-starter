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
2. **Set the Build Command** to `npm run build:auto`. This runs `scripts/setup-auth.mjs` then `convex deploy --cmd 'next build'` — it pushes your Convex functions + schema, auto-provisions the auth keys, then builds Next.js injecting `NEXT_PUBLIC_CONVEX_URL`.
3. **Set env vars** `NEXT_PUBLIC_CONVEX_URL` + `CONVEX_DEPLOY_KEY`, then deploy.

Every git push redeploys both Convex and the frontend.

## Local dev

```bash
npm install
npx convex dev   # terminal 1 — prompts to create/link a deployment, writes NEXT_PUBLIC_CONVEX_URL
npm run dev      # terminal 2 — http://localhost:3000
```

Sign up on `/login` to create your account.

## What's inside

- `/` — landing page
- `/login` — auth (sign up / sign in)
- `/dashboard` — your notes, live via Convex

Auth is [`@convex-dev/auth`](https://labs.convex.dev/auth) Password provider (open signup). Data is a `notes` table, per-user, with server-side ownership checks on every mutation.
