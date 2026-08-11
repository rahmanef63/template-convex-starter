// The phone's "all apps" sheet. Two reasons it earns a test: it is the only
// route to sign in/out on mobile (the sidebar footer is hidden below md), and it
// is the only place both feature groups are shown at once.
import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MoreSheet } from "@/components/os/more-sheet";
import { WORKSPACES, splitFeatures } from "@/components/os/menu";
import { expectNoA11yViolations } from "./axe";

// NavUser talks to Convex + next/navigation; this suite is about the sheet.
vi.mock("@/components/os/nav-user", () => ({
  NavUser: () => <button type="button">Sign in</button>,
}));

// jsdom 30 ships HTMLDialogElement as an empty subclass — no showModal/close.
// `open` IS reflected to the attribute, which is all the UA `dialog:not([open])`
// rule (and therefore Testing Library's visibility filter) needs.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

const { project, system } = splitFeatures(WORKSPACES[2]!.features);

function setup({ open = true, active = project[0]!.slug } = {}) {
  const onClose = vi.fn();
  const onSelect = vi.fn();
  const view = render(
    <MoreSheet
      open={open}
      onClose={onClose}
      project={project}
      system={system}
      active={active}
      onSelect={onSelect}
    />,
  );
  return { ...view, onClose, onSelect, user: userEvent.setup() };
}

describe("MoreSheet", () => {
  it("exposes nothing while closed", () => {
    setup({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: project[0]!.label })).not.toBeInTheDocument();
  });

  it("shows every feature of the active workspace, both groups", () => {
    setup();
    const dialog = screen.getByRole("dialog", { name: "All apps" });
    for (const item of [...project, ...system]) {
      expect(within(dialog).getByRole("button", { name: item.label })).toBeInTheDocument();
    }
    // The dock only fits three; the sheet is where the rest live.
    expect(project.length + system.length).toBeGreaterThan(3);
  });

  it("groups them under Project and System", () => {
    setup();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Project")).toBeInTheDocument();
    expect(within(dialog).getByText("System")).toBeInTheDocument();
  });

  it("marks the active feature and only that one", () => {
    setup({ active: system[0]!.slug });
    const current = within(screen.getByRole("dialog"))
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName(system[0]!.label);
  });

  it("selects a feature and dismisses itself in one tap", async () => {
    const { user, onSelect, onClose } = setup();
    await user.click(screen.getByRole("button", { name: system[1]!.label }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(system[1]!.slug);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("carries the account menu — a phone's only way to sign in or out", () => {
    setup();
    expect(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Sign in" }),
    ).toBeInTheDocument();
  });

  it("locks background scroll while open and releases it on unmount", () => {
    const { unmount } = setup();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("has no axe violations", async () => {
    const { container } = setup();
    await expectNoA11yViolations(container);
  });
});
