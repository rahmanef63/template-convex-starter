# AGENTS.md — Svelte 5 Runes + Bun + Convex starter

This file is the single source of truth for AI coding tools working in the
Svelte variant of this starter. Read it before writing code.

Goal: make a beginner-friendly full-stack starter that remains clean under
AI-assisted development: no legacy Svelte syntax, no duplicated state, no
spaghetti, no silent security shortcuts.

## Stack contract

- **SvelteKit** + **Svelte 5**.
- **Svelte 5 Runes mode for all new code.** This is non-negotiable.
- **TypeScript** everywhere.
- **Bun** is the only package manager/runtime used by project commands.
- **Convex Cloud** is the backend/database/realtime layer.
- **`convex-svelte`** is the Svelte client integration.
- **Tailwind CSS v4** for styling.
- **shadcn-svelte** for reusable UI primitives; generated components live in
  `$lib/components/ui` and are owned by this repo after generation.
- Prefer platform APIs and SvelteKit primitives before adding dependencies.

## Rule tiers

- **[P0] Security/data integrity:** never violate. Stop rather than route around
  a missing auth/ownership/validation boundary.
- **[P1] Architecture/SSOT:** deviate only when genuinely necessary and leave a
  `// TODO(rr): <reason + compliant target>` at the deviation.
- **[P2] Style/modularity:** enforced by formatter/lint/check/tests.

## Svelte 5 Runes — hard rules

Every new `.svelte`, `.svelte.ts`, and `.svelte.js` file uses modern Svelte 5
syntax. Do not let an AI model silently fall back to Svelte 3/4 patterns.

### Use

- Reactive local state → `$state(...)`.
- Computed state → `$derived(...)` / `$derived.by(...)`.
- Side effects only → `$effect(...)`.
- Component props → `$props()` with typed destructuring.
- Bindable props only when two-way binding is actually part of the component
  contract → `$bindable(...)`.
- DOM events → event attributes such as `onclick`, `oninput`, `onsubmit`.
- Parent-provided markup → snippets + `{@render ...}`.
- Shared reactive logic outside components → runes in `.svelte.ts` modules when
  that is simpler than a store.
- SvelteKit reactive route state → modern `$app/state` APIs where applicable.

### Do not use in new code

- Legacy reactive declarations: `$: foo = ...` or `$: { ... }`.
- `export let` for props.
- `on:click`, `on:input`, `on:submit`, or other legacy event directives.
- `createEventDispatcher` for ordinary component communication; accept callback
  props instead.
- `<slot>` / named slots when snippets express the contract.
- Legacy class-component APIs.
- A writable store merely because old Svelte tutorials use stores. Runes are the
  default for new shared reactive state; use stores only for a concrete interop
  or subscription-shaped need.

### Reactivity discipline

- Do not make a value reactive unless the UI or another reactive computation
  needs to observe it.
- Prefer `$derived` for data that can be computed from state. Do not use
  `$effect` to copy one piece of state into another.
- `$effect` is an escape hatch for real side effects: subscriptions, imperative
  browser APIs, logging/telemetry, and external systems.
- Avoid chains of effects. If an effect exists only to maintain app state,
  redesign the state graph.
- Keep state ownership as close as possible to the feature that owns it.

## AI tooling — mandatory for Svelte edits

Svelte's official AI documentation/tooling is part of this starter's working
method, not optional reading.

1. Before implementing an unfamiliar Svelte/SvelteKit API, consult the current
   official Svelte docs rather than relying on model memory.
2. When available, install/use the official Svelte AI tooling (`sv add
   ai-tools`) and Svelte MCP.
3. For every created or substantially edited `.svelte` file, run the official
   **svelte-autofixer** / Svelte code-writer workflow and address actionable
   findings before declaring the file done.
4. If the tool is unavailable, say that verification is missing; do not pretend
   a TypeScript pass proves Svelte semantics are correct.

## Package manager: Bun only

Use:

```bash
bun install
bun add <package>
bun add -d <package>
bunx <cli>
bun run <script>
```

Do not create npm/pnpm/yarn lockfiles and do not hand the user npm/pnpm/yarn
commands for this variant.

## Source-of-truth map

| Concern | Single source of truth | Never duplicate in |
| --- | --- | --- |
| Data shape | `src/convex/schema.ts` | hand-written frontend models |
| Convex data types | `src/convex/_generated/dataModel` | duplicate TS interfaces |
| Backend logic | `src/convex/*.ts` | UI components |
| Auth/ownership helpers | `src/convex/_shared/auth.ts` | inline copies |
| Server validation | Convex `v.*` validators | client-only checks |
| Routes | `src/routes/**` | ad-hoc router state |
| Reusable product UI | `src/lib/components/**` | copied page markup |
| UI primitives | `src/lib/components/ui/**` | local one-off reimplementations |
| Shared app logic | `src/lib/**` | route copy-paste |
| Theme/design tokens | global CSS variables | hard-coded component colors |
| Environment contract | `.env.example` | undocumented secret assumptions |
| Agent rules | root `AGENTS.md` | duplicated CLAUDE/Cursor prose |

`src/convex/_generated/` is generated. Never edit it by hand.

## Convex + Svelte rules

SvelteKit expects application source under `src/`, so this variant uses:

```json
{
  "functions": "src/convex/"
}
```

in root `convex.json`.

- Initialize `convex-svelte` once in the root layout with `setupConvex(...)`.
- Consume Convex with `convex-svelte` APIs such as `useQuery` rather than writing
  a second client/subscription layer.
- `useQuery(...)` is already reactive. Do **not** wrap it in `$derived` just to
  make it reactive again.
- Use SvelteKit SSR helpers from `convex-svelte` when SSR materially improves the
  route. Do not build a duplicate REST layer just to fetch Convex data on the
  server.
- **[P0] Every mutation that touches user-owned data authenticates the caller and
  verifies ownership server-side.** Client visibility is never authorization.
- **[P0] Every query/mutation/action validates public arguments with `v.*`.**
- **[P1] Query by index, not table scans.** Add the index to the schema and use
  `.withIndex(...)`.
- **[P1] Bound reads** with pagination or a deliberate limit; do not collect an
  unbounded growing table.
- Secrets used by Convex functions live on the Convex deployment, not in
  `PUBLIC_*` variables.
- User-facing backend failures use typed/structured errors and do not leak
  internals.

## shadcn-svelte rules

- Use the CLI-generated shadcn-svelte component as the primitive before making a
  second local primitive that solves the same problem.
- Generated UI lives under `$lib/components/ui/<component>/` and is treated as
  source code owned by this repo; customize it there instead of wrapping every
  primitive with another compatibility component.
- Compose product-specific UI under `$lib/components/<feature>/`.
- Use the shared `cn()` helper for conditional class composition.
- Use design tokens/CSS variables. Do not scatter arbitrary hex colors through
  feature components.
- Do not install a second headless UI system for a primitive already covered by
  shadcn-svelte/Bits UI unless there is a concrete missing capability.
- Accessibility is part of the component contract: semantic elements, labels,
  keyboard behavior, visible focus, reduced-motion support, and correct dialog
  semantics.

## Responsive/mobile app UI rules

The default application shell is mobile-first and layered like a native app:

1. **App/background layer** fills `100dvh` and `100%` width.
2. **Context/app-bar layer** is sticky and safe-area aware.
3. **Primary content layer** is full-width; readable text may have an inner
   measure, but the screen container itself must not be arbitrarily capped.
4. **Bottom navigation/dock layer** spans the phone width and respects
   `env(safe-area-inset-bottom)`.
5. **Modal/sheet layer** uses an accessible top-layer primitive.

Rules:

- Avoid `max-w-*` on app screen roots unless the product explicitly calls for a
  reading/form measure. If used, the outer screen still stays `w-full`.
- Do not force desktop horizontal setting rows into narrow phones; stack them.
- Touch targets should be approximately 44px or larger for primary controls.
- No horizontal page scrolling. Horizontal carousels must own their overflow.
- Use `dvh` and safe-area insets for mobile shells; avoid fragile `100vh` layouts.
- Loading/skeleton states mirror the final layout to avoid jumps.

## SvelteKit boundaries

- Prefer server `load` / `+page.server.ts` only when server-only work is actually
  required.
- Do not access browser globals during SSR without a browser boundary.
- Keep secrets in server-only env modules; `PUBLIC_*` means browser-readable.
- Use form actions/enhance for conventional server forms when they are a better
  fit than client RPC.
- Use SvelteKit error/redirect helpers and route conventions rather than a custom
  routing abstraction.

## Anti-spaghetti

- One file, one responsibility. Split files that become difficult to scan or do
  multiple unrelated jobs; ~200 LOC is a useful warning, not a reason to invent
  meaningless fragments.
- Reuse before adding dependencies or helpers.
- Extract on the second real caller, not speculatively.
- No compatibility/placeholder files whose only job is preserving obsolete
  imports. Update callers and delete obsolete paths.
- No duplicate domain types that already flow from Convex schema/codegen.
- No app-wide global state for local component concerns.

## Feature golden path

For a feature backed by Convex:

1. **Schema** — add/adjust the table and required indexes in
   `src/convex/schema.ts`.
2. **Backend** — add validated query/mutation/action functions; auth + ownership
   on writes, indexed/bounded reads.
3. **Codegen** — refresh generated Convex API/types.
4. **Tests** — prove unauthenticated rejection, per-user isolation, ownership,
   validation, and important business invariants.
5. **UI** — build with Svelte 5 Runes and shadcn-svelte primitives; handle
   loading, empty, error, disabled/busy, and success states.
6. **Svelte validation** — run Svelte autofixer on edited Svelte code.
7. **Project gates** — run check/lint/tests/build, then exercise the real flow in
   a browser at mobile and desktop widths.

## Definition of done

A change is not done because it compiles.

Required evidence for a normal feature change:

```bash
bun run check
bun run test
bun run build
```

Also verify the affected flow in a real browser. For UI changes, check at least a
phone viewport and a desktop viewport. For deployment work, verify the deployment
provider reports the new deployment as ready; a healthy old alias is not proof
that the new build shipped.
