# `src/` — drop your ongoing project here

This folder is a **staging area**, not part of the app. The build never imports
from `src/`. Drop an existing project (or loose files) in here and ask your AI
coder to **weave it into the starter**:

> "Weave `src/` into this starter."  ·  `/weave-src`

The AI follows the playbook in [`/AGENTS.md`](../AGENTS.md) →
**Merging an ongoing project** — it maps your pages into `app/`, your data into
`convex/schema.ts` + functions, your auth onto `@convex-dev/auth`, one feature
at a time, each following the `add-feature` golden path. As each piece is
absorbed and verified in the browser, it's removed from here.

When `src/` is empty again, delete it. Nothing that ships should import from it.

**Don't** wire `src/` into routes, `next.config`, or `tsconfig` paths — keep it
quarantined until the code has been rewritten to the starter's conventions.
