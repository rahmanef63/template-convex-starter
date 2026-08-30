# Svelte 5 Runes + Bun + Convex — tech stack blueprint

This is the proposed sibling of `convex-starter`. It copies the starter's
security/SSOT philosophy, not its React component code.

## Decision

Use **SvelteKit + Svelte 5 Runes + TypeScript + Bun + Convex + convex-svelte +
Tailwind CSS v4 + shadcn-svelte**.

The base target stays deployable to **Vercel + Convex Cloud**. Bun is the only
package manager and the local command runtime; Vercel remains the default web
adapter so the app does not depend on a community Bun server adapter.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App framework | SvelteKit | Routing, SSR, forms, server boundaries, adapters |
| UI runtime | Svelte 5 | Current Svelte architecture |
| Reactivity | **Runes only** | Explicit modern reactivity; prevents Svelte 3/4 AI output |
| Language | TypeScript | End-to-end typed contracts |
| Package manager | **Bun** | One install/run/tooling path |
| Backend + DB | Convex Cloud | Reactive DB, functions, storage, scheduling |
| Svelte Convex client | `convex-svelte` | Official Svelte 5 reactive client + SSR support |
| Styling | Tailwind CSS v4 | Tokenized utility styling |
| UI primitives | `shadcn-svelte` | Svelte port of shadcn, source-owned components |
| Headless primitives | Bits UI via shadcn-svelte | Avoid a second competing primitive layer |
| Icons | `@lucide/svelte` | Current shadcn-svelte icon path |
| Unit/component tests | Vitest + `@testing-library/svelte` + axe | Fast behavior/a11y coverage |
| E2E | Playwright | Real layout, mobile, dialog, auth flow checks |
| AI guardrails | Svelte AI tools/MCP + repo `AGENTS.md` | Current docs + Svelte-aware static analysis |
| Deploy | `@sveltejs/adapter-vercel` + Convex Cloud | Same operational shape as current starter |

## Bootstrap

Use Bun even when upstream docs show npm/pnpm examples:

```bash
bunx sv@latest create svelte-convex-starter --add tailwindcss
cd svelte-convex-starter

bun add convex convex-svelte
bunx shadcn-svelte@latest init
bunx shadcn-svelte@latest add button card input dialog sheet dropdown-menu skeleton sonner
bunx sv add ai-tools
```

During `sv create`, choose:

- SvelteKit minimal
- TypeScript syntax
- Bun
- Tailwind CSS v4
- ESLint/Prettier/Vitest/Playwright if offered and useful for the scaffold

Do not add a second package-manager lockfile.

## Convex layout

SvelteKit wants project source under `src/`, so Convex functions live there too.

`convex.json`:

```json
{
  "functions": "src/convex/"
}
```

Install/link a development deployment with Bun:

```bash
bunx convex dev
```

Recommended root layout shape:

```svelte
<script lang="ts">
  import '../app.css';
  import { PUBLIC_CONVEX_URL } from '$env/static/public';
  import { setupConvex } from 'convex-svelte';

  let { children } = $props();

  setupConvex(PUBLIC_CONVEX_URL);
</script>

{@render children()}
```

This is intentionally modern Svelte 5: `$props()` + `{@render}`. Do not translate
it back to `export let`, slots, or legacy event directives.

## Convex data pattern

Client components use `convex-svelte` directly. `useQuery()` is already reactive;
do not wrap it in `$derived` merely to make it reactive.

For first-load performance and SEO-sensitive pages, prefer the official SvelteKit
SSR bridge (`convexLoad` / `convexLoadPaginated`) so server-fetched data upgrades
to a live Convex subscription after hydration.

Backend rules stay the same as the existing Convex starter:

- validate every public function argument;
- authenticate and verify ownership server-side for user-owned writes;
- index growing query paths;
- bound every growing read;
- derive frontend types from Convex codegen;
- keep secrets on the server/Convex deployment;
- never edit generated Convex files.

## Auth decision

Do **not** copy React-only auth client code from the Next starter.

`convex-svelte` exposes provider-neutral `setupAuth()` / `useAuth()` and can wire
an OIDC provider or adapter into the Convex client. The official docs currently
list Svelte adapters for Convex Auth / Convex Better Auth as community-maintained,
so the base Svelte starter should keep the auth boundary explicit rather than
pretend there is a first-party drop-in equivalent to the React integration.

Recommended approach:

1. Base scaffold: provider-neutral auth contract around `setupAuth()`.
2. Product chooses auth deliberately:
   - hosted OIDC provider for production/B2B needs, or
   - a reviewed Convex Auth / Convex Better Auth Svelte adapter when that tradeoff
     is acceptable.
3. Backend authorization remains independent of the UI provider.

## Folder architecture

```text
svelte-convex-starter/
├── AGENTS.md
├── CHECKLIST.md
├── convex.json
├── components.json
├── package.json
├── svelte.config.js
├── vite.config.ts
├── src/
│   ├── app.css
│   ├── app.d.ts
│   ├── convex/
│   │   ├── _generated/
│   │   ├── _shared/
│   │   ├── schema.ts
│   │   └── <feature>.ts
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/          # shadcn-svelte source-owned primitives
│   │   │   └── <feature>/   # product components
│   │   ├── state/           # shared .svelte.ts runes only when needed
│   │   ├── server/          # server-only helpers
│   │   └── utils.ts         # cn(), small shared utilities
│   └── routes/
│       ├── +layout.svelte
│       ├── +page.svelte
│       ├── login/
│       └── os/
├── tests/
└── e2e/
```

## Runes policy for AI

A generated Svelte file is rejected if new code uses any of these without a
migration-specific reason:

```text
$: ...
export let ...
on:click / on:input / on:submit
createEventDispatcher(...)
<slot>
```

Expected modern equivalents:

```text
$state(...)
$derived(...) / $derived.by(...)
$effect(...) only for side effects
$props()
onclick / oninput / onsubmit
callback props
{#snippet ...} + {@render ...}
```

`$effect` must not become the Svelte equivalent of React effect abuse. Derived
values belong in `$derived`; ordinary event-driven updates belong in event
handlers.

## UI system

Use shadcn-svelte for primitives, then compose application-specific surfaces on
top. Do not wrap every generated primitive in another one-line component.

Default shell behavior:

- full-width/full-height app frame;
- desktop sidebar when useful;
- mobile sticky app bar;
- full-width mobile content surface;
- bottom navigation spanning the phone width;
- safe-area padding for notches/home indicators;
- sheet/dialog as a distinct top layer;
- responsive settings/forms stack vertically on narrow phones;
- horizontal carousels own their scroll instead of making the page overflow;
- skeletons mirror final geometry;
- 44px-ish primary touch targets;
- reduced-motion support.

A text/article body can have a readable inner measure. The **screen root itself**
should not accidentally become a narrow `max-w-*` column.

## Testing/gates

Recommended scripts:

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "lint": "prettier --check . && eslint .",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "verify": "bun run check && bun run lint && bun run test && bun run build"
  }
}
```

UI completion requires more than jsdom/unit coverage. Exercise at minimum:

- a narrow phone viewport;
- a modern phone viewport with safe-area assumptions;
- tablet/desktop;
- keyboard navigation;
- modal/sheet focus behavior;
- no horizontal document overflow.

## What to copy from the existing Next starter

Copy **principles and contracts**, not framework syntax:

- Convex schema/function security patterns;
- auth + ownership invariants;
- rate-limit approach;
- error/loading/empty-state expectations;
- version/update contract;
- mobile app shell behavior;
- AGENTS/CHECKLIST discipline;
- test intent.

Rewrite:

- React components → Svelte 5 Runes components;
- React hooks → Svelte/`convex-svelte` primitives;
- Next routes/layouts → SvelteKit routes/layouts/load functions;
- React UI primitives → shadcn-svelte equivalents;
- Next metadata/deploy glue → SvelteKit equivalents.

Never create compatibility files just to keep old React/Next imports alive.

## AI anti-hallucination workflow

Before accepting Svelte code from an AI:

1. Confirm the task is being implemented as **Svelte 5 Runes**, not merely
   "Svelte 5 compatible" legacy syntax.
2. Consult current Svelte/SvelteKit docs for any uncertain API.
3. Consult current `convex-svelte` docs for Convex client/SSR/auth APIs.
4. Use shadcn-svelte CLI/docs for UI primitive APIs; do not assume React shadcn
   imports or props match the Svelte port.
5. Run Svelte autofixer on edited `.svelte` files.
6. Run the project verification gates.
7. Browser-test the actual responsive flow.
