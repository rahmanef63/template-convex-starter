# CHECKLIST.md — the ship checklist

**One file, one purpose:** everything that has to be true before this app is
"maximal" — SEO, performance, security, accessibility, data, UX, testing,
deploy. `AGENTS.md` says *how* to build; this says *what must hold when you're
done*. Run it before every ship, and again after adding a feature.

- `[x]` = **already done in the template** — the file that does it is named.
  Don't rebuild it; if you change it, keep the box true.
- `[ ]` = **you do this** — per-app work the template can't do for you.

Fast path: `bun run check` (typecheck + lint + tests) → `bun run build` →
drive the flow in the browser. Or ask your AI tool for **`/ship-check`**
(`.claude/skills/ship-check`), which walks this file for you.

---

## 0. The gate (never ship red)

- [x] Typecheck, lint, tests, and a production build all run from one command — `package.json` → `bun run check`, `bun run build`
- [ ] `bun run check` passes
- [ ] `bun run build` passes (this is also what Vercel runs, via `build:auto`)
- [ ] The feature was **driven in a browser**, not just typechecked
- [ ] `git status` is clean of stray `.bak` / scratch / generated files

## 1. SEO & discoverability

- [x] Title template + description + `metadataBase` — `app/layout.tsx`
- [x] Canonical URL (`alternates.canonical`) — `app/layout.tsx`
- [x] Open Graph + Twitter `summary_large_image` — `app/layout.tsx`
- [x] Social preview image, generated at build time — `app/opengraph-image.tsx`
- [x] `robots.txt` + `sitemap.xml` from the canonical URL — `app/robots.ts`, `app/sitemap.ts`
- [x] Web app manifest + theme color — `app/manifest.ts`, `viewport` in `app/layout.tsx`
- [x] Favicon — `app/icon.svg`
- [x] Site name / copy / brand colors have **one** home — `lib/site.ts`
- [ ] Every new public route exports its own `metadata` (title + description)
- [ ] Every new public route is added to `app/sitemap.ts`
- [ ] Private routes are **not** in the sitemap and don't leak data in metadata
- [ ] One `<h1>` per page, headings in order, real link text (not "click here")
- [ ] `SITE_URL` (or Vercel's production domain) is correct — canonical, OG, and
      sitemap URLs are all derived from it (`lib/site.ts` → `siteUrl()`)

## 2. Performance

- [x] System font stack — zero webfont bytes, zero layout shift — `app/globals.css`
- [x] Static prerender for every page; only `/api/chat` is dynamic (check the
      route table printed by `bun run build`)
- [x] Reactive data over polling — Convex `useQuery` subscribes, no interval refetch
- [x] Loading states are real skeletons, not spinners on empty layout — `components/skeleton.tsx`
- [x] Speed Insights (Core Web Vitals, free) — `app/layout.tsx`; enable it in the Vercel project tab
- [ ] Images go through `next/image` with explicit `width`/`height` (no raw `<img>`)
- [ ] No new client-side dependency > ~30 kB gzipped without a reason in the PR
- [ ] Heavy, below-the-fold client components are `next/dynamic`
- [ ] Convex reads use `.withIndex(...)`, never `.filter()` on a growing table
- [ ] A list that can grow is paginated (`.paginate()`), not `.collect()`-ed whole
- [ ] Lighthouse on the deployed URL ≥ 90 Performance / ≥ 95 Best Practices

## 3. Security

**[P0] — a red box here blocks the ship.**

- [x] Security headers on every response (nosniff, frame-deny, referrer,
      permissions, HSTS) + no `x-powered-by` — `next.config.ts`
- [x] Auth + ownership helpers with a "missing row and someone else's row look
      identical" rule — `convex/_shared/auth.ts`
- [x] The AI route is sign-in gated (verifies the caller's Convex JWT) and
      rate-limited per user — `app/api/chat/route.ts`
- [x] Auth signing keys are generated at build time, never printed — `scripts/setup-auth.mjs`
- [x] Secrets are server-only; `.env*.local` is gitignored — `.env.example`, `.gitignore`
- [ ] **Every mutation starts with `requireUser(ctx)`** and re-checks row ownership
- [ ] **Every query/mutation declares `args` with `v.*` validators**; user strings
      are trimmed and length-bounded before insert
- [ ] User-facing failures throw `ConvexError({ code, message })` — no internal
      details, no stack traces reaching the client
- [ ] No secret is behind a `NEXT_PUBLIC_` name (grep before shipping)
- [ ] No API key is read in a `"use client"` file
- [ ] Any new `app/api/*` route authenticates the caller the same way `chat` does
- [ ] Third-party webhooks verify their signature before doing work
- [ ] Optional hardening: add a Content-Security-Policy. It needs per-request
      nonces (a `proxy.ts` that stamps the nonce + `headers()`), so do it once
      you know your inline-script inventory — a wrong CSP breaks the app silently

## 4. Accessibility

- [x] Visible keyboard focus ring on every interactive element — `app/globals.css`
- [x] Native `<button>` / `<label>` / `<form>` throughout, no UI-kit dependency
- [x] Theme respects `color-scheme` and persists the user's choice — `components/theme-provider.tsx`
- [ ] Every input has a real `<label>` (or `aria-label`), every image an `alt`
- [ ] The whole flow works with the keyboard alone (Tab / Enter / Esc)
- [ ] Text passes contrast in **both** themes — check the light theme too
- [ ] Icon-only buttons carry an accessible name
- [ ] Nothing conveys meaning by color alone

## 5. Data & Convex

- [x] Schema is the single source of truth; types flow from `Doc<"table">` — `convex/schema.ts`
- [x] Every user-owned table has a `by_user` index — `convex/schema.ts`
- [x] Backend tests prove auth + isolation + ownership — `tests/*.test.ts`
- [ ] New table has the index its queries actually use (no scans)
- [ ] No field is stored twice (derive it instead)
- [ ] No `createdAt` field — Convex gives you `_creationTime`
- [ ] A schema change that could break existing rows has a migration plan
      (widen → backfill → narrow; see `.claude/skills/convex-migration-helper`)
- [ ] `convex/_generated/` is committed and current (`bun run convex:codegen`)

## 6. UX states

- [ ] **Loading** — `data === undefined` renders a skeleton, not a blank box
- [ ] **Empty** — first-run copy that says what to do next, not "No data"
- [ ] **Error** — mutation failures surface via `useToast()` + `errorMessage()`
- [ ] **Offline / signed out** — private screens show a sign-in path, not a crash
- [x] Global error boundary + 404 page — `app/error.tsx`, `app/not-found.tsx`
- [ ] Destructive actions confirm, or are undoable
- [ ] Forms disable their submit button while in flight (no double-submit)

## 7. Testing

- [x] Vitest + convex-test run offline, no deployment needed — `vitest.config.mts`, `tests/harness.ts`
- [ ] Each new feature has a test proving: unauthenticated is rejected, users are
      isolated, only the owner can mutate (copy `tests/notes.test.ts`)
- [ ] Any non-trivial pure helper in `lib/` has one test
- [ ] `bun run test` is green

## 8. Deploy & env

- [x] One build command deploys Convex + builds Next, and refuses to push a PR
      preview onto production — `scripts/build.mjs`, `vercel.json`
- [x] Every env var is documented with where it's set — `.env.example`
- [x] Dependency updates arrive as safe grouped PRs — `.github/dependabot.yml`
- [ ] `NEXT_PUBLIC_CONVEX_URL` + `CONVEX_DEPLOY_KEY` are set in Vercel
- [ ] A new env var was added to `.env.example` **and** to Vercel (all
      environments that need it) — a build that reads an unset var must fail loud
- [ ] Preview deploys use a `preview:` deploy key, or knowingly build frontend-only
- [ ] The production URL loads, sign-up works, and a write round-trips
- [ ] Vercel Analytics + Speed Insights are enabled in the project tabs

## 9. Repo hygiene (keeps the AI honest)

- [x] One rules file, everything else points at it — `AGENTS.md` (+ `CLAUDE.md`, `.cursor/rules/`)
- [x] Golden-path recipes as skills — `.claude/skills/`
- [ ] No file over ~200 lines or doing three unrelated things
- [ ] No abstraction with a single caller; no config for a value that never changes
- [ ] Deviations from `AGENTS.md` carry a `// TODO(rr): <why + compliant version>`
- [ ] `src/` is empty or deleted (nothing that ships imports from it)
- [ ] Dead code, unused deps, and commented-out blocks are gone

---

### Adding to this file

Add a box when a rule is real and checkable — not "consider caching". Every
`[x]` names the file that keeps it true, so a reviewer can verify it in one
jump. If a box stops being true, the fix is code, not deleting the box.
