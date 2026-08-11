# Project rules

All rules for working in this repo live in one place. Read and follow:

@AGENTS.md

Before shipping anything — a feature, a fix, a refactor — walk the ship
checklist (SEO, performance, security, accessibility, data, UX states, testing,
deploy). It is one file:

@CHECKLIST.md

`AGENTS.md` = **how** to build. `CHECKLIST.md` = **what must be true** when
you're done. Run it with `/ship-check`, or by hand: `bun run check` →
`bun run build` → drive the flow in the browser.

(This file intentionally holds no rules of its own, so the sources can never
drift.)
