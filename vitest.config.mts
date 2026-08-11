import { defineConfig } from "vitest/config";

// Tests are never a production run. Vitest only defaults NODE_ENV to "test" when
// it is UNSET, and Vercel exports NODE_ENV=production for the whole build — which
// makes react-dom load its production bundle, where `act` does not exist, so
// every React Testing Library render dies with "React.act is not a function".
// Set it here (before Vite resolves anything) so `bun run test` behaves the same
// on a laptop and inside the deploy gate. Caught by scripts/build.mjs refusing a
// red suite; the fix belongs here, not in the gate's invocation.
process.env.NODE_ENV = "test";

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
