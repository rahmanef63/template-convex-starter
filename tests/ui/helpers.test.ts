// Pure helpers — no DOM, no Convex. They live under tests/ui/ because that's the
// project `bun run test` points at everything-that-isn't-convex-test; a third
// Vitest project for two files would be config for nothing.
import { describe, expect, it } from "vitest";
import { ConvexError } from "convex/values";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/cn";
import { NOTES, WORKSPACES, splitFeatures } from "@/components/os/menu";

describe("errorMessage", () => {
  it("reads the message out of a ConvexError({ code, message })", () => {
    const err = new ConvexError({ code: "NOT_FOUND", message: "Note not found." });
    expect(errorMessage(err)).toBe("Note not found.");
  });

  it("honours a bare ConvexError(string) for back-compat", () => {
    expect(errorMessage(new ConvexError("Too long."))).toBe("Too long.");
  });

  it("falls back rather than leaking an internal error", () => {
    expect(errorMessage(new Error("connect ECONNREFUSED 127.0.0.1:3210"))).toBe(
      "Something went wrong.",
    );
    expect(errorMessage(undefined)).toBe("Something went wrong.");
    expect(errorMessage(new Error("boom"), "Custom fallback.")).toBe("Custom fallback.");
  });

  it("falls back when the ConvexError payload has no string message", () => {
    expect(errorMessage(new ConvexError({ code: "X" }))).toBe("Something went wrong.");
    expect(errorMessage(new ConvexError({ code: "X", message: 42 }))).toBe(
      "Something went wrong.",
    );
  });
});

describe("cn", () => {
  it("drops falsy branches and joins the rest", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
    expect(cn()).toBe("");
  });
});

describe("splitFeatures", () => {
  it("splits one workspace's menu into the two nav groups plus a slug lookup", () => {
    const { project, system, bySlug } = splitFeatures(WORKSPACES[0]!.features);
    expect(project.every((m) => m.group === "project")).toBe(true);
    expect(system.every((m) => m.group === "system")).toBe(true);
    expect(project.length + system.length).toBe(WORKSPACES[0]!.features.length);
    expect(bySlug[NOTES.slug]).toEqual(NOTES);
  });

  it("puts Notes in every seeded workspace", () => {
    // Notes is the one real feature; every workspace ships it or the shell's
    // default screen would 404 into a placeholder. Nothing else about the seed
    // menus is asserted — they're placeholder copy, free to edit in a fork.
    expect(WORKSPACES.every((w) => w.features.some((f) => f.slug === NOTES.slug))).toBe(true);
  });
});
