# AGENTS.md — how to work in this repo

This file is the **single source of truth** for how any AI coding tool (Cursor,
Claude Code, Copilot, Windsurf, …) should build on top of this template. Read it
before writing code. `CLAUDE.md` and `.cursor/rules/` just point here — do not
duplicate rules into them.

Goal: a beginner can vibe-code features on this starter and the result stays
clean — no AI slop, no copy-paste, no spaghetti, one source of truth per fact.

## What this is

Next.js 16 (App Router) + React 19 + **Convex** (reactive backend + DB) +
`@convex-dev/auth` (Password) + Tailwind v4 + TypeScript. Deploys to Vercel;
`convex deploy` runs on every build. See `README.md` for the deploy contract.

## Golden rules (the short list)

1. **Don't build what isn't needed yet.** Delete beats add. (YAGNI)
2. **One source of truth per fact.** Never store the same thing twice.
3. **Every Convex mutation checks auth + ownership.** No exceptions.
4. **Query by index, never scan the table** (`.withIndex`, not `.filter`).
5. **Reuse before you write.** Search the repo for an existing helper first.
6. **Match the surrounding code** — its naming, its patterns, its density.
7. If your change needs a paragraph to justify, it's probably too clever.

## Where things live (SSOT map)

| Concern | Single source of truth | Never duplicate it in |
| --- | --- | --- |
| Data shape | `convex/schema.ts` | frontend types — derive from `Doc<"table">` |
| Data types | `convex/_generated/dataModel` (`Doc`, `Id`) | hand-written interfaces |
| Backend logic | `convex/*.ts` (queries/mutations) | the frontend (don't reimplement) |
| Auth check | `convex/_shared/auth.ts` (`requireUser`) | inline `getAuthUserId` copies |
| Routes / pages | `app/**` | — |
| Shared UI | `components/**` | copy-pasted JSX |
| Env / deploy | `.env.example` + `package.json` `build:auto` | — |

`convex/_generated/` is auto-generated (committed so Vercel can typecheck). Never
edit it by hand; it refreshes on `npx convex dev` / `deploy`.

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

- **Auth on every mutation.** Start handlers with `const userId = await
  requireUser(ctx)` (from `convex/_shared/auth.ts`). For row edits, load the row
  and throw if `row.userId !== userId`. See `convex/notes.ts` for the pattern.
- **Index, don't scan.** Add an index in `schema.ts` and use `.withIndex(...)`.
  `.filter()` on a table scans every row and gets slow — reserve it for tiny sets.
- **Validate args.** Every query/mutation declares `args` with `v.*` validators.
  Trim/bound user strings before insert (see `notes.add`).
- **Throw `ConvexError`** for user-facing failures; the client reads `err.data`.
- **Never touch `convex/_generated`.** Import from it, don't edit it.

## Frontend rules (no AI slop)

The look should feel intentional, not templated. Avoid the generic-AI tells:

- No purple→blue gradients on white/dark, no `Inter`-everything, no three
  identical rounded cards as the whole page.
- Pick real spacing, one type scale, a restrained palette. Tailwind here already
  uses a neutral system-font base (`app/globals.css`) — extend it, don't fight it.
- Prefer native elements + Tailwind classes over pulling a UI-kit dependency for
  one button. Accessibility is not optional: real `<button>`/`<label>`, `alt`
  text, focus states, keyboard support.
- Loading and empty states are part of the feature, not an afterthought (see the
  dashboard: `notes === undefined` and `notes.length === 0` are both handled).

## Anti-spaghetti

- A file that scrolls past ~200 lines or does 3 unrelated things → split it.
- Name things for what they are (`toggleNote`, not `handleClick2`).
- Colocate: a component's helpers live next to it until a second caller appears.
- Keep the data flow one-directional: Convex query → component props → render.
  Don't thread state through five components — read it where you need it with
  `useQuery`.

## Adding a feature (the golden path)

Three steps, in order, every time:

1. **Schema** — add the table/field + its index in `convex/schema.ts`.
2. **Functions** — `query` to read (auth + `.withIndex`), `mutation` to write
   (auth + ownership + validated args) in a new `convex/<feature>.ts`. Copy the
   shape of `convex/notes.ts`.
3. **UI** — a page/component using `useQuery(api.<feature>.list)` /
   `useMutation(...)`. Gate private data behind `<Authenticated>`.

Then verify it actually works (drive the flow in the browser), not just that it
typechecks. See `README.md` → Local dev.

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

- The assistant lives in `app/api/chat/route.ts` (server, holds the key) + a
  client page. Model is a single constant at the top of the route.
- **Default model `claude-sonnet-5`** (best speed/quality for chat). Use
  `claude-opus-4-8` for the hardest reasoning, `claude-haiku-4-5` for cheap/simple.
  Change the one constant.
- **Never expose `ANTHROPIC_API_KEY` to the browser** — it's server-only, read
  inside the route. Anything AI/LLM should call Claude via `@ai-sdk/anthropic`.

## When NOT to be lazy

Never simplify away: input validation at trust boundaries, auth/ownership checks,
error handling that prevents data loss, accessibility basics, or anything the
user explicitly asked for. Lazy means less code, not a flimsier result.
