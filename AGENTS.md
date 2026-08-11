# AGENTS.md — how to work in this repo

This file is the **single source of truth** for how any AI coding tool (Cursor,
Claude Code, Copilot, Windsurf, …) should build on top of this template. Read it
before writing code. `CLAUDE.md` and `.cursor/rules/` just point here — do not
duplicate rules into them. The repo's agent skills live in `.claude/skills/` as
plain Markdown — any tool can read them, Claude Code just auto-discovers them.

Goal: a beginner can vibe-code features on this starter and the result stays
clean — no AI slop, no copy-paste, no spaghetti, one source of truth per fact.

## What this is

Next.js 16 (App Router) + React 19 + **Convex** (reactive backend + DB) +
`@convex-dev/auth` (Password) + Tailwind v4 + TypeScript. Deploys to Vercel;
`convex deploy` runs on every build. See `README.md` for the deploy contract.

## Relationship to rr (Rahman Resources)

This starter follows the **rr best-practice doctrine** (the `resources` repo →
`/best-practice`, source `lib/content/best-practices.ts`). It is an rr
**TEMPLATE** — a whole-app scaffold you fork, not a sliced library — in its
**online** flavor: Convex **Cloud** + **Vercel** + **native UI**. Three
departures from the default rr slice-app, each a sanctioned TEMPLATE choice (not
an oversight):

- **Monolithic `app/**` + `convex/<feature>.ts`**, not `slices/<slug>/` — rr
  templates are forkable scaffolds without slice metadata.
- **Convex Cloud + Vercel**, not self-hosted + Dokploy — rr's "online" path.
- **Native elements + Tailwind**, not shadcn — zero UI-kit dependency (the
  anti-slop pitch). Everything else here is straight rr.

**Rule tiers.** Rules below carry a severity so you know what bends:

- **[P0]** security & data integrity — *never* violate. If a P0 blocks the task,
  STOP and report; never route around it.
- **[P1]** architecture & structure — violate only when genuinely necessary, and
  only with a `// TODO(rr): <why + the compliant version>` at the site plus a
  note in the commit body.
- **[P2]** style & modularity — enforced by lint/typecheck/tests; if the tooling
  passes, you pass.

Two comment markers carry that context in code, and both are grep targets:
`// TODO(rr): <why + the compliant version>` for a P1 deviation, and
`// ponytail: <ceiling + upgrade path>` for a deliberate shortcut that works now
and names where it stops (see `convex/_shared/rateLimit.ts`, `convex/auth.ts`).

## Agent protocol (how to apply these rules)

1. Before writing: check whether the change crosses a rule below — follow it even
   if unasked.
2. Reuse first: search the repo (`lib/`, `components/`, `convex/_shared/`) for an
   existing helper before adding code or a dependency.
3. A **P0** conflict (missing auth/ownership, unvalidated args, a secret behind
   `NEXT_PUBLIC_`) → STOP and report. Never ship around it.
4. A necessary **P1** deviation → leave `// TODO(rr): <why + compliant version>`
   at the site and call it out in the commit body.
5. State which rules a change honors — e.g. "authz via `requireUser`; indexed via
   `.withIndex` (no scan)."
6. After editing: `bun run check` (typecheck + lint + tests), then drive the flow
   in the browser. Typecheck is not proof it works. The Vercel build runs the
   same lint + tests as a gate before `convex deploy` (`scripts/build.mjs`), so
   leaving them red doesn't ship — it just fails the deploy later and louder.
7. Before shipping: walk **[`CHECKLIST.md`](CHECKLIST.md)** — the single ship
   checklist (SEO, performance, security, a11y, data, UX states, testing,
   deploy). This file says *how* to build; that one says *what must be true* when
   you're done. `/ship-check` runs it.

**Package manager: bun.** `bun install`, `bun run <script>`, `bunx <cli>`. There
is no npm lockfile — don't create one, and don't hand a user an `npm`/`npx`
command for this repo.

## Golden rules (the short list)

1. **[P2] Don't build what isn't needed yet.** Delete beats add. (YAGNI)
2. **[P1] One source of truth per fact.** Never store the same thing twice.
3. **[P0] Every Convex mutation checks auth + ownership.** No exceptions.
4. **[P1] Query by index, never scan the table** (`.withIndex`, not `.filter`).
5. **[P1] Reuse before you write.** Search the repo for an existing helper first.
6. **[P2] Match the surrounding code** — its naming, its patterns, its density.
7. **[P2]** If your change needs a paragraph to justify, it's probably too clever.

## Where things live (SSOT map)

| Concern | Single source of truth | Never duplicate it in |
| --- | --- | --- |
| Data shape | `convex/schema.ts` | frontend types — derive from `Doc<"table">` |
| Data types | `convex/_generated/dataModel` (`Doc`, `Id`) | hand-written interfaces |
| Backend logic | `convex/*.ts` (queries/mutations) | the frontend (don't reimplement) |
| Auth check | `convex/_shared/auth.ts` (`requireUser`) | inline `getAuthUserId` copies |
| Rate limiting | `convex/_shared/rateLimit.ts` (`rateLimit(ctx, key, {max, windowMs})`) | a `Map` in a route handler — it only limits one instance |
| Sending email | `convex/_shared/email.ts` (`sendEmail`) | a second mail client or SDK |
| Server error logs | `instrumentation.ts` (`onRequestError`) | `console.error` scattered in routes |
| Routes / pages | `app/**` | — |
| Shared UI | `components/**` (incl. `toast.tsx`, `skeleton.tsx`) | copy-pasted JSX |
| Mutation error UX | `useToast()` + `lib/errors.ts` (`errorMessage`) | ad-hoc alert/console |
| Backend tests | `tests/*.test.ts` (Vitest + convex-test) | — |
| Frontend tests | `tests/ui/*.test.tsx` (Vitest + RTL + axe) | — |
| Env / deploy | `.env.example` + `scripts/build.mjs` (`build:auto`) | — |
| Site name / copy / brand colors | `lib/site.ts` | hardcoded strings in metadata, OG image, manifest |
| Security headers | `next.config.ts` | per-route header hacks |
| Template version | `version.json` (`lib/version.ts` reads it) | a version string typed anywhere else |
| Ship criteria | `CHECKLIST.md` | ad-hoc "looks good to me" |

`convex/_generated/` is auto-generated (committed so Vercel can typecheck). Never
edit it by hand; it refreshes on `bunx convex dev` / `deploy`.

## The laziness ladder (before writing code)

Stop at the first rung that holds:

1. **Does this need to exist?** Speculative → skip it, say so.
2. **Stdlib / language feature does it?** Use it.
3. **Native platform covers it?** `<input type="date">` over a picker lib, a DB
   index over app-side sorting, CSS over JS.
4. **An installed dep already solves it?** Use it. Don't add a dep for a few lines.
5. **Can it be one line?** One line.
6. **Only then:** the minimum code that works.

No abstraction with one caller. No config for a value that never changes. No
"for later" scaffolding — later can scaffold for itself.

## DRY & SSOT (concrete)

- **Types flow from the schema.** Add a field in `convex/schema.ts`; the frontend
  gets it via `Doc<"table">` / the generated `api` types. Don't re-type it.
- **Logic lives in Convex, not the client.** If two pages need the same read,
  it's one Convex `query` both call — not two copies.
- **One helper, one home.** Reused function → `lib/` or `convex/_shared/`. If you
  copy-paste a block twice, extract it on the second time (not the first).
- **Config once.** A constant used in 3 places is `export const` in one file.

## Convex rules (correctness & security — never cut these)

- **[P0] Auth on every mutation.** Start handlers with `const userId = await
  requireUser(ctx)` (from `convex/_shared/auth.ts`). For row edits, load the row
  and throw if `row.userId !== userId`. See `convex/notes.ts` for the pattern.
- **[P0] Validate args.** Every query/mutation declares `args` with `v.*`
  validators. Trim/bound user strings before insert (see `notes.add`).
- **[P1] Index, don't scan.** Add an index in `schema.ts` and use `.withIndex(...)`.
  `.filter()` on a table scans every row and gets slow — reserve it for tiny sets.
- **[P1] Bound every read.** `.take(MAX_*)` (export the constant, see
  `convex/notes.ts` → `MAX_NOTES`) or `.paginate()`. A `.collect()` on a table
  that grows is a defect here, even when today's data is small.
- **[P1] A new `convex/<feature>.ts` needs codegen.** `api.<feature>` doesn't
  exist until `bun run convex:codegen` (or `bunx convex dev`) regenerates
  `convex/_generated/`. If you can't run it in your environment, put the function
  in an existing module (`auth.ts`, `users.ts`, `notes.ts`, `workspaces.ts`)
  rather than shipping an import that doesn't resolve. Helpers under
  `convex/_shared/` export no Convex functions and need no codegen.
- **[P0] Convex-side secrets live on the Convex deployment**, set with
  `bunx convex env set NAME value` — not in Vercel, not in `.env.local` for
  production. A Convex action never sees Next's process env (see
  `RESEND_API_KEY` / `AUTH_EMAIL_FROM` in `convex/_shared/email.ts`). Document
  every one in `.env.example` with *where* it's set.
- **[P1] A feature that needs a key stays optional.** With the key unset, the
  template must still boot and that one feature reports itself unconfigured —
  a typed `ConvexError({ code: "NOT_CONFIGURED" })` or an HTTP 503, never a crash
  and never a silent no-op. The assistant and password reset both do this.
- **[P1] Throw typed `ConvexError`** for user-facing failures:
  `throw new ConvexError({ code: "NOT_FOUND", message: "…" })`. The client reads
  `err.data.message` via `errorMessage()` (`lib/errors.ts`) and can branch on
  `code`. Never leak internal details in the message.
- **[P0] Never touch `convex/_generated`.** Import from it, don't edit it.

There is no server-side route gate on purpose: auth tokens live in localStorage,
so no proxy/middleware can read them — pages are static shells and every private
read/write is an authed Convex function. If you migrate to cookie-based auth
(`ConvexAuthNextjsProvider`), add a `proxy.ts` and gate there with
`convexAuth.isAuthenticated()`.

## Frontend rules (no AI slop)

The look should feel intentional, not templated. Avoid the generic-AI tells:

- No purple→blue gradients on white/dark, no `Inter`-everything, no three
  identical rounded cards as the whole page.
- Pick real spacing, one type scale, a restrained palette. Tailwind here already
  uses a neutral system-font base (`app/globals.css`) — extend it, don't fight it.
- Prefer native elements + Tailwind classes over pulling a UI-kit dependency for
  one button. Accessibility is not optional: real `<button>`/`<label>`, `alt`
  text, focus states, keyboard support.
- Loading and empty states are part of the feature, not an afterthought (see
  `components/os/notes-screen.tsx`: `notes === undefined` and `notes.length === 0`
  are both handled).

## Anti-spaghetti

- A file that scrolls past ~200 lines or does 3 unrelated things → split it.
- Name things for what they are (`toggleNote`, not `handleClick2`).
- Colocate: a component's helpers live next to it until a second caller appears.
- Keep the data flow one-directional: Convex query → component props → render.
  Don't thread state through five components — read it where you need it with
  `useQuery`.

## Adding a feature (the golden path)

Four steps, in order, every time:

1. **Schema** — add the table/field + its index in `convex/schema.ts`.
2. **Functions** — `query` to read (auth + `.withIndex` + bounded), `mutation` to
   write (auth + ownership + validated args) in a new `convex/<feature>.ts`, then
   `bun run convex:codegen` so `api.<feature>` exists. Copy `convex/notes.ts`.
3. **Tests** — prove auth + ownership hold: copy `tests/notes.test.ts`
   (unauthenticated rejected, users isolated, only the owner mutates).
   `bun run test` runs offline, no deployment needed.
4. **UI** — a page/component using `useQuery(api.<feature>.list)` /
   `useMutation(...)`. Gate private data behind `<Authenticated>`, show loading
   with `<Skeleton>`, surface mutation failures with `useToast()` +
   `errorMessage()`. Then add a component test in `tests/ui/` that queries by
   role + accessible name (never a snapshot) and ends with
   `expectNoA11yViolations(container)` — `bun run test` runs both projects.

Then verify it actually works (drive the flow in the browser), not just that it
typechecks. See `README.md` → Local dev.

`convex/notes.ts` is the minimal example (list + owner-only writes). For the
fuller pattern — per-user CRUD (create/rename/delete + ownership), a public
placeholder that graduates to Convex behind `<Authenticated>`, and a
data-source-agnostic UI — see `convex/workspaces.ts` + the `/os` shell
(`app/os/**`, `components/os/**`).

## Merging an ongoing project (`src/` → this starter)

You can start from an existing app instead of a blank page. The user drops their
project into `src/` (a quarantined staging area — the build never imports it) and
asks you to **weave it in** (`/weave-src`). Don't copy-paste it wholesale; absorb
it one feature at a time so the result is this starter's golden path, not the old
code's shape.

1. **Inventory `src/` and report back.** Identify the stack (framework, data
   layer, auth, styling, env/secrets) and list the routes, data models, and
   external calls before changing anything.
2. **Map each concern to the SSOT** (rewrite the plumbing, don't port it):
   - Pages/routes → `app/**`; interactive parts → `"use client"`.
   - Data models / DB / ORM / REST → `convex/schema.ts` + `convex/<feature>.ts`
     (validated args, `requireUser`, `.withIndex`) — external calls become Convex
     functions the client calls with `useQuery`/`useMutation`.
   - Any auth (JWT, sessions, NextAuth, Clerk, custom) → `@convex-dev/auth`.
   - CSS framework → Tailwind v4 + `app/globals.css`; port the design *tokens*.
   - Secrets → `.env.example` + server routes. Never `NEXT_PUBLIC_` a secret.
   - LLM/AI calls → `app/api/chat/route.ts` via `@ai-sdk/anthropic`.
3. **Absorb one feature at a time** with the `add-feature` recipe (schema →
   authz'd function → typed UI). Verify in the browser, then delete that slice
   from `src/`.
4. **Delete `src/` when empty.** Nothing that ships imports from it.

Everything absorbed obeys the rules above — auth + ownership on every mutation,
index-don't-scan, one SSOT per fact, ≤200-line files, no slop. Drop features the
old app carried that the user doesn't actually need.

## AI (Vercel AI SDK)

- The assistant lives in `app/api/chat/route.ts` (server, holds the key) + the
  Assistant screen in the `/os` shell (`components/os/assistant-screen.tsx`).
  Model is a single constant at the top of the route.
- **Default model `claude-sonnet-5`** (best speed/quality for chat). Use
  `claude-opus-4-8` for the hardest reasoning, `claude-haiku-4-5` for cheap/simple.
  Change the one constant.
- **Never expose `ANTHROPIC_API_KEY` to the browser** — it's server-only, read
  inside the route. Anything AI/LLM should call Claude via `@ai-sdk/anthropic`.

## When NOT to be lazy

Never simplify away: input validation at trust boundaries, auth/ownership checks,
error handling that prevents data loss, accessibility basics, or anything the
user explicitly asked for. Lazy means less code, not a flimsier result.
