---
name: ship-check
description: Run the repo's ship checklist before shipping. Use when the user says "ship it", "ready to deploy?", "review before push", "/ship-check", "audit this app", or asks about SEO / performance / security / accessibility readiness in this project. Runs the gate commands, greps for the rule violations that matter, and reports against CHECKLIST.md.
---

# Ship check

`/CHECKLIST.md` is the SSOT for what must be true before shipping. This skill
executes it: run the gate, hunt the violations a grep can catch, then report the
boxes that are actually red. Don't restate the whole file — report **failures +
the fix**, and one line confirming what passed.

## 1. Gate (run these first, in this order)

```bash
bun run check     # typecheck + lint + tests
bun run build     # same build Vercel runs; also prints the route table
```

A red gate ends the check — fix it before looking at anything else. From the
build output, note any route that became **dynamic (ƒ)** unexpectedly: that's a
perf regression worth flagging (CHECKLIST → Performance).

## 2. Automated sweeps

Run these; each maps to a `[ ]` box. Report hits with `file:line`.

```bash
# [P0] mutation without an auth check — every hit is a blocker
rg -n "mutation\(\{" convex --after-context=12 | rg -B12 "handler" | rg -L "requireUser|requireOwn"
rg -n "export const \w+ = mutation" convex/*.ts        # then read each handler

# [P0] a secret behind a public name, or a key read in client code
rg -n "NEXT_PUBLIC_\w*(KEY|SECRET|TOKEN|PASSWORD)" --glob '!*.md'
rg -ln '"use client"' app components | xargs -r rg -n "process\.env\.(?!NEXT_PUBLIC_)" -P

# [P1] table scan instead of an index
rg -n "\.query\(\"" convex --after-context=2 | rg "\.filter\("

# [P1] missing arg validators
rg -n "args: \{\}" convex/*.ts                          # fine only for real no-arg fns

# perf: raw <img>, unbounded reads
rg -n "<img " app components
rg -n "\.collect\(\)" convex                            # ok on bounded sets, flag growing ones

# UX: loading/empty states, error handling
rg -n "useQuery\(" app components                       # each caller must handle `undefined`
rg -n "catch\s*\(" app components | rg -v "errorMessage|toast"

# hygiene
rg -n "TODO\(rr\)" .                                     # deliberate deviations — list them
rg --files-with-matches "" src 2>/dev/null | head        # src/ should be empty or gone
find app components lib convex -name '*.ts*' -not -path '*_generated*' \
  | xargs wc -l | sort -rn | head -8                     # anything > ~200 lines
```

## 3. Judgment passes (read, don't grep)

- **SEO** — does each new public route export `metadata`, and is it in
  `app/sitemap.ts`? Is anything private *in* the sitemap?
- **A11y** — every input labelled, icon-only buttons named, keyboard path works.
- **UX states** — for each `useQuery`, is `undefined` (loading) and empty handled?
- **Schema** — new field stored twice anywhere? Index matches the actual query?

## 4. Report

Give the user, in this order:

1. **Blockers** — every `[P0]` hit (auth, ownership, validators, leaked secrets),
   as `file:line` + the one-line fix. Say plainly that these block the ship.
2. **Should fix** — `[P1]` structure/perf hits.
3. **Verify by hand** — the boxes a machine can't check (browser flow, Lighthouse,
   env vars set in Vercel).
4. **Passed** — one line, not a list.

Then offer to fix the blockers. Don't silently fix anything during the audit —
the report is the deliverable.

## Notes

- If `CHECKLIST.md` has boxes this skill doesn't cover, check them by hand and
  say so. `CHECKLIST.md` wins over this file if they ever disagree.
- Adding a box to `CHECKLIST.md` that a command can prove? Add the command here too.
