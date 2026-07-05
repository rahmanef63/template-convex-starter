---
name: add-feature
description: The clean way to add a data-backed feature to this Convex + Next.js starter. Use whenever the user wants to add a new thing users can create/read/update/delete (a list, a table, a form, a resource). Enforces the schema → validated+authz'd function → typed UI golden path so features stay DRY, secure, and non-spaghetti.
---

# Add a feature (golden path)

Follow these steps in order. Read `/AGENTS.md` first — it's the SSOT for all
rules; this skill is just the recipe. Mirror `convex/notes.ts` +
`app/dashboard/page.tsx` as the reference implementation.

## 1. Schema (the data SSOT)

Add the table + its access index to `convex/schema.ts`:

```ts
myThings: defineTable({
  userId: v.id("users"),
  // ...fields, with v.* validators
}).index("by_user", ["userId"]),
```

- Every user-owned row carries `userId: v.id("users")`.
- Add an index for how you'll read it (`by_user`, `by_slug`, …). You'll query by
  index, never scan.
- Don't add a `createdAt` — Convex gives you `_creationTime` free.

## 2. Functions (auth + ownership + validation)

New file `convex/myThings.ts`. Every function declares `args`; every mutation
starts with `requireUser` and re-checks ownership before touching a row:

```ts
import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./_shared/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return ctx.db.query("myThings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc").collect();
  },
});

export const add = mutation({
  args: { /* validated fields */ },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    // trim/bound user strings before insert
    return ctx.db.insert("myThings", { userId, ...args });
  },
});

export const remove = mutation({
  args: { id: v.id("myThings") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.userId !== userId) throw new ConvexError("Not found");
    await ctx.db.delete(id);
  },
});
```

Non-negotiable: **auth on every mutation, ownership check on every edit, index on
every read.** Never `.filter()` a growing table.

## 3. UI (typed, live, gated)

A page/component that reads with `useQuery` and writes with `useMutation`. Types
come from the generated `api` — don't hand-write them:

```tsx
"use client";
import { Authenticated } from "convex/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Page() {
  return <Authenticated>{/* your feature */}</Authenticated>;
}
```

Handle `data === undefined` (loading) and empty states. Use native elements +
Tailwind; don't pull a UI-kit dep for one control.

## 4. Verify

Run it: `npx convex dev` (one terminal) + `npm run dev` (another), then drive the
feature in the browser. Typecheck is not proof it works.

## Guardrails to keep in mind

- **DRY:** if a read is needed in two places, it's one shared `query`, not two.
- **SSOT:** the field lives in `schema.ts` only; the frontend derives its type.
- **No slop:** intentional spacing/type, real accessibility, not three identical
  cards. See `/AGENTS.md` → Frontend rules.
- **Lazy:** don't add fields, endpoints, or abstractions the feature doesn't need.
