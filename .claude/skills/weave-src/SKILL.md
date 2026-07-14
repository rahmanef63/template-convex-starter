---
name: weave-src
description: Merge an ongoing/existing project into this Convex + Next.js starter. Use when the user has dropped code into `src/` (or points at an existing app) and wants it "woven in", ported, migrated, absorbed, or rebuilt on this stack. Decomposes the dropped project into features and runs the add-feature golden path on each, so the result stays DRY, secure, and non-spaghetti instead of a copy-paste dump.
---

# Weave `src/` into the starter

Read `/AGENTS.md` first — it is the SSOT for every rule. This skill is the recipe
for absorbing an existing project; the full playbook lives at `/AGENTS.md` →
**Merging an ongoing project**. Per-feature work hands off to the `add-feature`
skill.

## When to use

- The user dropped an existing project / loose files into `src/`.
- The user wants an existing app "ported to", "rebuilt on", or "migrated into"
  this Next.js 16 + Convex starter.

## When NOT to use

- Building a brand-new feature from scratch → use `add-feature`.
- The dropped code is a single self-contained asset (an image, a copy doc) with
  no logic to port → just move it where it belongs.

## The loop (one feature at a time — never a bulk dump)

1. **Inventory `src/`.** What is the stack (framework, data layer, auth, styling,
   env/secrets)? List the routes/pages, the data models, the external calls.
   Report this back before touching anything.
2. **Map each concern to this starter's SSOT** (do not copy the old plumbing):
   - Pages/routes → `app/**` (App Router). Interactive bits → `"use client"`.
   - Data models / DB tables / ORM / REST → `convex/schema.ts` + a
     `convex/<feature>.ts` (validated args, `requireUser`, `.withIndex`).
   - Auth of any kind (JWT, sessions, NextAuth, Clerk, custom) → `@convex-dev/auth`.
   - Styling / CSS framework → Tailwind v4 + `app/globals.css`. Port the design
     *tokens*, not the framework.
   - Secrets / API keys → `.env.example` + server routes. Never `NEXT_PUBLIC_` a secret.
   - LLM / AI calls → the `app/api/chat/route.ts` pattern via `@ai-sdk/anthropic`.
3. **Absorb one feature via `add-feature`:** schema → authz'd function → typed UI.
   Rewrite to the golden path — do **not** carry over the old code's spaghetti,
   duplicated types, or table scans.
4. **Verify in the browser**, then delete that slice of code from `src/`.
5. **Repeat** until `src/` holds only leftovers, then **delete `src/`.**

## Non-negotiable

- The build must never import from `src/` — it's quarantined until rewritten.
- Everything absorbed obeys `/AGENTS.md`: auth + ownership on every mutation,
  index-don't-scan, validators, one SSOT per fact, ≤200-line files, no AI slop.
- Lazy: drop features the old app had but the user doesn't need. Deletion wins.
