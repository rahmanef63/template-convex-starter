// axe-core directly — no matcher package. `vitest-axe` is a 0.x pinned to
// vitest ^0.17 whose documented `extend-expect` entry ships an empty file, so it
// buys nothing this helper doesn't do in ten lines.
import axe from "axe-core";
import { expect } from "vitest";

export async function expectNoA11yViolations(container: Element) {
  const { violations } = await axe.run(container, {
    // jsdom has no layout engine, so contrast can never be computed here — the
    // light/dark palettes are checked in a real browser (CHECKLIST §4).
    rules: { "color-contrast": { enabled: false } },
  });
  expect(
    violations.map((v) => `${v.id} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
}
