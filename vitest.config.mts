import { defineConfig } from "vitest/config";

// convex-test runs Convex functions in an edge-runtime VM (same constraints as
// the real Convex runtime) and must not be pre-bundled.
export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
  },
});
