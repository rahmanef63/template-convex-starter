# CHECKLIST.md — the ship checklist

**One file, one purpose:** everything that has to be true before this app is
"maximal" — SEO, performance, security, accessibility, data, UX, testing,
deploy. `AGENTS.md` says *how* to build; this says *what must hold when you're
done*. Run it before every ship, and again after adding a feature.

- `[x]` = **already done in the template** — the file that does it is named.
  Don't rebuild it; if you change it, keep the box true.
- `[ ]` = **you do this** — per-app work the template can't do for you. Some
  unchecked boxes name a **known limit** of a `[x]` above it (the edge of what
  the template claims) and say how to close it. Nothing is ticked that the code
  doesn't earn.

Fast path: `bun run check` (typecheck + lint + tests) → `bun run build` →
drive the flow in the browser. Or ask your AI tool for **`/ship-check`**
(`.claude/skills/ship-check`), which walks this file for you.

---

## 0. The gate (never ship red)

- [x] Typecheck, lint, tests, and a production build all run from one command — `package.json` → `bun run check`, `bun run build`
- [x] Vercel's build refuses to deploy a red suite — lint + tests run *before*
      `convex deploy`, so a failure leaves the backend untouched — `scripts/build.mjs`
- [ ] `bun run check` passes
- [ ] `bun run build` passes (this is also what Vercel runs, via `build:auto`)
- [ ] The feature was **driven in a browser**, not just typechecked. Everything
      behind sign-in — sign-up, password reset, a write that round-trips — is
      *only* provable this way: convex-test is an in-memory simulation and the
      template has never exercised those flows against a live deployment
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
- [x] Every public route the template ships declares its own canonical, so none
      of them inherits the root's `"/"` — `app/os/page.tsx`, `app/login/page.tsx`
      (`app/page.tsx` deliberately has none: the root defaults already describe it)
- [ ] Every new public route exports its own `metadata` (title + description)
- [ ] Every new public route is added to `app/sitemap.ts`
- [ ] Private routes are **not** in the sitemap and don't leak data in metadata
- [ ] One `<h1>` per page, headings in order, real link text (not "click here")
- [ ] `SITE_URL` (or Vercel's production domain) is correct — canonical, OG, and
      sitemap URLs are all derived from it (`lib/site.ts` → `siteUrl()`)
- [ ] View source on the **deployed** page: exactly one `<link rel="canonical">`
      and one `og:url` per route, both pointing at that route. The tags are
      correct in source; nobody has read the rendered `<head>` in a browser
- [ ] Structured data (JSON-LD) if a rich result is actually available for your
      app. Deliberately not shipped: a bare `SoftwareApplication`/`WebSite` entry
      earns nothing without `offers`/`aggregateRating` we'd have to invent

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
- [x] Every read the template ships is bounded — `.take(MAX_*)`, never `.collect()`
      on a growing table — `convex/notes.ts`, `convex/workspaces.ts`
- [ ] Convex reads use `.withIndex(...)`, never `.filter()` on a growing table
- [ ] A list that can grow is bounded (`.take(MAX)`) or paginated (`.paginate()`),
      never `.collect()`-ed whole
- [ ] Lighthouse on the deployed URL ≥ 90 Performance / ≥ 95 Best Practices

## 3. Security

**[P0] — a red box here blocks the ship.**

- [x] Security headers on every response (nosniff, frame-deny, referrer,
      permissions, HSTS) + no `x-powered-by` — `next.config.ts`
- [x] Auth + ownership helpers with a "missing row and someone else's row look
      identical" rule — `convex/_shared/auth.ts`
- [x] The AI route is sign-in gated (verifies the caller's Convex JWT) and
      rate-limited per user — `app/api/chat/route.ts`
- [x] Rate limits are **global**, not per serverless instance — the counter is a
      Convex row — `convex/_shared/rateLimit.ts`, `convex/schema.ts` → `rateLimits`
- [x] Sign-in / sign-up / password-reset attempts are throttled per email address
      before any account lookup — `convex/auth.ts` → `throttleCredentials`
- [x] Password recovery exists and fails safe: an emailed code (15-min TTL,
      single use, never logged) that stays inert behind a clear "not configured"
      error until `RESEND_API_KEY` + `AUTH_EMAIL_FROM` are set **on the Convex
      deployment** — `convex/auth.ts`, `convex/_shared/email.ts`
- [x] The reset form can't be used to discover who has an account — it answers
      the same way for every address — `app/login/login-client.tsx`
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

Known limits of what's ticked above — decide whether each one matters to you:

- [ ] Add a Content-Security-Policy. It needs per-request nonces (a `proxy.ts`
      that stamps the nonce + `headers()`), so do it once you know your
      inline-script inventory — a wrong CSP breaks the app silently
- [ ] Throttling is **per email address only** — a Convex action can't read the
      caller's IP, so credential stuffing spread across many distinct addresses
      is not caught. Close it in front of the app (CDN/WAF rate rule), or key a
      limit on an IP your own `app/api/*` route reads from `x-forwarded-for`
- [ ] `Bob@x.com` and `bob@x.com` are still **two accounts** — identity isn't
      case-normalized (the rate-limit key is). Close it by normalizing in
      `profile()` *and* backfilling `authAccounts.providerAccountId`; doing one
      without the other orphans existing accounts
- [ ] Re-verify the auth throttle after any `@convex-dev/auth` bump: it wraps the
      provider's internal `.options.authorize` (pinned at 0.0.94). A shape change
      throws at deploy time by design — read the `ponytail:` note in `convex/auth.ts`
- [ ] Confirm on a live deployment that a throttled attempt actually surfaces
      "too many requests" (not the generic fallback). The limit itself always
      holds; only the message depends on `ConvexError` crossing
      `ctx.runMutation` / `ConvexHttpClient` with `.data` intact, which can't be
      exercised offline — `convex/_shared/rateLimit.ts`
- [ ] If you shorten the reset code (it's the library default: 32 chars, meant to
      be copy-pasted), tighten the verification budget in the same commit — a
      6-digit code under a 10-per-10-minutes budget is guessable

## 4. Accessibility

- [x] Visible keyboard focus ring on every interactive element — `app/globals.css`
- [x] Native `<button>` / `<label>` / `<form>` throughout, no UI-kit dependency
- [x] Theme respects `color-scheme` and persists the user's choice — `components/theme-provider.tsx`
- [x] An automated axe pass runs over every component test — `tests/ui/axe.ts`
- [x] Every input on the auth form has a real `<label>`, an `autocomplete` token,
      and `aria-invalid` + `aria-describedby` wiring to a `role="alert"` message;
      busy buttons use `aria-disabled` so focus is never dumped —
      `app/login/login-client.tsx`
- [ ] Every input has a real `<label>` (or `aria-label`), every image an `alt`
- [ ] The whole flow works with the keyboard alone (Tab / Enter / Esc)
- [ ] Text passes contrast in **both** themes — check the light theme too. This
      one stays manual: jsdom has no layout engine, so the axe pass in
      `tests/ui/` disables `color-contrast`. Run Lighthouse/axe in a real browser
- [ ] Icon-only buttons carry an accessible name
- [ ] Nothing conveys meaning by color alone
- [ ] The four components that need Convex/auth providers have **no** automated
      axe pass — `components/os/nav-user.tsx`, `notes-screen.tsx`,
      `assistant-screen.tsx`, `app/os/os-shell.tsx`. Their a11y was fixed by
      inspection. Close it by mounting them in `tests/ui/` with mocked
      `useQuery`/`useAuthActions`/`useRouter`, or by driving them signed-in
- [ ] Modal behavior of the mobile sheet is a **browser-only** check — focus
      trap, Esc to close, inert background, focus restore, backdrop. jsdom ships
      an empty `HTMLDialogElement`, so the test stubs `showModal()` and proves
      only the content — `components/os/more-sheet.tsx`, `tests/ui/more-sheet.test.tsx`
- [ ] No route-level a11y claim is made: the axe pass covers `components/**`
      only, not the pages in `app/**` that compose them

## 5. Data & Convex

- [x] Schema is the single source of truth; types flow from `Doc<"table">` — `convex/schema.ts`
- [x] Every user-owned table has a `by_user` index — `convex/schema.ts`
- [x] Backend tests prove auth + isolation + ownership — `tests/*.test.ts`
- [ ] New table has the index its queries actually use (no scans)
- [ ] No field is stored twice (derive it instead)
- [ ] No `createdAt` field — Convex gives you `_creationTime`
- [ ] A schema change that could break existing rows has a migration plan
      (widen → backfill → narrow; see `.claude/skills/convex-migration-helper`)
- [ ] `convex/_generated/` is committed and current (`bun run convex:codegen`).
      A **new** `convex/<feature>.ts` doesn't exist to the client until codegen
      runs — that's why a function added without it belongs in an existing module
- [ ] A `rateLimits` row for a key that goes quiet is never deleted. Fine for the
      per-user keys shipped here; if you ever key by IP or email domain, add a
      cron that deletes rows whose `windowStart` is older than a window —
      `convex/_shared/rateLimit.ts`

## 6. UX states

- [ ] **Loading** — `data === undefined` renders a skeleton, not a blank box
- [ ] **Empty** — first-run copy that says what to do next, not "No data"
- [ ] **Error** — mutation failures surface via `useToast()` + `errorMessage()`
- [ ] **Offline / signed out** — private screens show a sign-in path, not a crash
- [x] Global error boundary + 404 page — `app/error.tsx`, `app/not-found.tsx`
- [x] Server errors are logged with their `digest`, so the reference code shown to
      the user is searchable in the runtime logs — `instrumentation.ts`
- [ ] Destructive actions confirm, or are undoable
- [ ] Forms disable their submit button while in flight (no double-submit)
- [ ] A **client-side** render error's digest is not in any log — `onRequestError`
      only fires server-side. Close it with an error-reporting SDK in
      `app/error.tsx` if client digests matter to you — `instrumentation.ts`
- [ ] A reset request that genuinely fails (Resend down, or `SITE_URL` unset on
      the Convex deployment) still tells the user a code is coming — the neutral
      answer is what stops account enumeration. Watch the Convex logs when
      someone reports a missing code — `app/login/login-client.tsx`

## 7. Testing

- [x] Vitest + convex-test run offline, no deployment needed — `vitest.config.mts`, `tests/harness.ts`
- [x] Two projects, one command: `backend` (convex-test) + `ui` (React Testing
      Library + axe) both run under `bun run test` — `vitest.config.mts`
- [x] Component tests query by role and accessible name, no snapshots — `tests/ui/*.test.tsx`
- [x] Every rate limit has a test proving it refuses at the max, recovers in the
      next window, and never spends another key's budget — `tests/rate-limit.test.ts`
- [ ] Each new feature has a test proving: unauthenticated is rejected, users are
      isolated, only the owner can mutate (copy `tests/notes.test.ts`)
- [ ] Each new component has a test in `tests/ui/` that ends in `expectNoA11yViolations`
- [ ] Any non-trivial pure helper in `lib/` has one test
- [ ] `bun run test` is green — always `bun run test`, never bare `bun test`
      (Bun's own runner ignores `vitest.config.mts` and breaks on convex-test)

Two in-file conventions worth knowing before you "tidy" a test: timer-sensitive
cases in `tests/ui/toast.test.tsx` use `fireEvent`, not `userEvent`, because
`userEvent` deadlocks under Vitest fake timers (and `axe.run` never resolves
under them); `tests/rate-limit.test.ts` stubs `Date.now` for the same reason.

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
- [ ] Password reset: `RESEND_API_KEY` + `AUTH_EMAIL_FROM` are set **on the
      Convex deployment** (`bunx convex env set …`), not in Vercel — the sender
      runs inside a Convex action. Leave them unset and reset stays off, which is
      a valid state. `SITE_URL` must also exist there (the build sets it)
- [ ] The first deploy log shows `[build] gate passed (lint + tests green)`
      before `convex deploy`. The gate has only ever been exercised piecewise
      locally, never inside a real `build:auto` — `scripts/build.mjs`
- [ ] The gate needs devDependencies at build time (eslint, vitest).
      `vercel.json`'s `bun install` includes them — don't add `--production` or
      set `NODE_ENV=production` for the install step or the gate silently dies
- [ ] After the first deploy, grep the runtime logs for `"tag":"request-error"`
      to confirm the digest line lands where you expect — `instrumentation.ts`

## 9. Repo hygiene (keeps the AI honest)

- [x] One rules file, everything else points at it — `AGENTS.md` (+ `CLAUDE.md`, `.cursor/rules/`)
- [x] Golden-path recipes as skills — `.claude/skills/`
- [ ] No file over ~200 lines or doing three unrelated things. One known
      exception ships: `app/login/login-client.tsx` is 215 — close it by pulling
      its `Field` component into `components/`
- [ ] No abstraction with a single caller; no config for a value that never changes
- [ ] Deviations from `AGENTS.md` carry a `// TODO(rr): <why + compliant version>`
- [ ] Deliberate shortcuts carry a `// ponytail: <ceiling + upgrade path>` so the
      next reader knows where it stops working — see `convex/_shared/rateLimit.ts`
- [ ] `src/` is empty or deleted (nothing that ships imports from it)
- [ ] Dead code, unused deps, and commented-out blocks are gone

---

### Adding to this file

Add a box when a rule is real and checkable — not "consider caching". Every
`[x]` names the file that keeps it true, so a reviewer can verify it in one
jump. If a box stops being true, the fix is code, not deleting the box.
