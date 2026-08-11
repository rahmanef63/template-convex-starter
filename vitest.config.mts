import { defineConfig } from "vitest/config";

// Two suites, two runtimes, one `bun run test`. convex-test must run in an edge
// VM (the real Convex runtime's constraints) and must not be pre-bundled; React
// components need a DOM. Vitest 4 `projects` keeps them apart — a project
// inherits NOTHING from the root `test` block unless it sets `extends: true`, so
// each declares its own environment (and alias) in full. Keep the two `include`
// globs disjoint: `tests/*.test.ts` is non-recursive, so `tests/ui/**` is only
// ever picked up by the ui project.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "backend",
          environment: "edge-runtime",
          include: ["tests/*.test.ts"],
          server: { deps: { inline: ["convex-test"] } },
        },
      },
      {
        // Vitest does not read tsconfig `paths`, so `@/…` needs a real alias.
        // The bare "@" key only matches `@` and `@/…` — `@ai-sdk/react` and
        // friends resolve normally.
        resolve: { alias: { "@": import.meta.dirname } },
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["tests/ui/*.test.{ts,tsx}"],
          setupFiles: ["tests/ui/setup.ts"],
        },
      },
    ],
  },
});
