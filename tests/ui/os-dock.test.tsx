// The mobile dock. Two things a refactor breaks silently: which slug counts as
// "active" (the Menu slot owns everything not in the visible tabs), and the
// five-column grid that keeps the FAB centred for small workspaces.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OsDock } from "@/components/os/os-dock";
import { FAB, WORKSPACES, splitFeatures } from "@/components/os/menu";
import { expectNoA11yViolations } from "./axe";

const project = splitFeatures(WORKSPACES[2]!.features).project; // Hooli: 6 project features

function setup(active = project[0]!.slug, features = project) {
  const onSelect = vi.fn();
  const onOpenMore = vi.fn();
  const view = render(
    <OsDock projectFeatures={features} active={active} onSelect={onSelect} onOpenMore={onOpenMore} />,
  );
  return { ...view, onSelect, onOpenMore, user: userEvent.setup() };
}

const menuButton = () => screen.getByRole("button", { name: "Menu — all apps" });

describe("OsDock", () => {
  it("shows only the first three project features as tabs", () => {
    setup();
    for (const item of project.slice(0, 3)) {
      expect(screen.getByRole("button", { name: item.label })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: project[3]!.label })).not.toBeInTheDocument();
  });

  it("marks exactly one slot as current", () => {
    setup(project[1]!.slug);
    const current = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName(project[1]!.label);
  });

  it("hands the Menu slot everything that isn't a visible tab or the FAB", () => {
    setup(project[4]!.slug);
    expect(menuButton()).toHaveAttribute("aria-current", "page");
  });

  it("marks the FAB current for the assistant, not the Menu slot", () => {
    setup(FAB.slug);
    expect(screen.getByRole("button", { name: FAB.label })).toHaveAttribute("aria-current", "page");
    expect(menuButton()).not.toHaveAttribute("aria-current");
  });

  it("selects a tab and opens the sheet", async () => {
    const { user, onSelect, onOpenMore } = setup();
    await user.click(screen.getByRole("button", { name: project[2]!.label }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(project[2]!.slug);
    await user.click(screen.getByRole("button", { name: FAB.label }));
    expect(onSelect).toHaveBeenLastCalledWith(FAB.slug);
    await user.click(menuButton());
    expect(onOpenMore).toHaveBeenCalledOnce();
  });

  it("keeps five grid cells when the workspace has fewer than three features", () => {
    setup(project[0]!.slug, project.slice(0, 1));
    // Empty slots still render, or the raised FAB drifts off centre.
    expect(screen.getByRole("navigation", { name: "App dock" }).children).toHaveLength(5);
  });

  it("has no axe violations", async () => {
    const { container } = setup();
    await expectNoA11yViolations(container);
  });
});
