// Topbar = sidebar toggle + breadcrumb + theme picker. The breadcrumb is the
// only thing telling you where you are in the shell, so its order and its
// "current" marker are worth pinning.
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Topbar } from "@/components/os/topbar";
import { NOTES, WORKSPACES, splitFeatures } from "@/components/os/menu";
import { expectNoA11yViolations } from "./axe";

const settings = splitFeatures(WORKSPACES[0]!.features).system.find((m) => m.slug === "settings")!;

function setup({ app = NOTES, collapsed = false } = {}) {
  const onToggleSidebar = vi.fn();
  const view = render(
    <>
      <Topbar
        app={app}
        workspaceName={WORKSPACES[0]!.name}
        collapsed={collapsed}
        onToggleSidebar={onToggleSidebar}
      />
      {/* The toggle's aria-controls target. In the app that's the <aside
          id="os-sidebar"> of app/os/os-shell.tsx; rendered alone, the reference
          would dangle and axe would (correctly) flag aria-valid-attr-value. */}
      <aside id="os-sidebar" />
    </>,
  );
  return { ...view, onToggleSidebar, user: userEvent.setup() };
}

const crumbs = () =>
  within(screen.getByRole("navigation", { name: "Breadcrumb" }))
    .getAllByRole("listitem")
    .map((li) => li.textContent);

describe("Topbar", () => {
  it("reads workspace → group → feature, ending on the current one", () => {
    setup();
    expect(crumbs()).toEqual([WORKSPACES[0]!.name, "Project", NOTES.label]);
    expect(screen.getByText(NOTES.label)).toHaveAttribute("aria-current", "page");
  });

  it("labels system features as System, not Project", () => {
    setup({ app: settings });
    expect(crumbs()).toEqual([WORKSPACES[0]!.name, "System", settings.label]);
  });

  it("hides the '/' separators from assistive tech", () => {
    setup();
    // 3 crumbs exposed; the 2 separators are aria-hidden and must not be read.
    expect(crumbs()).toHaveLength(3);
  });

  it("announces sidebar state on the toggle and reports clicks", async () => {
    const { user, onToggleSidebar } = setup({ collapsed: true });
    const toggle = screen.getByRole("button", { name: "Toggle sidebar" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "os-sidebar"); // names what it expands
    await user.click(toggle);
    expect(onToggleSidebar).toHaveBeenCalledOnce();
  });

  it("flips aria-expanded when the sidebar is open", () => {
    setup({ collapsed: false });
    expect(screen.getByRole("button", { name: "Toggle sidebar" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("carries the theme picker, and every icon-only button has a name", () => {
    setup();
    expect(screen.getByRole("button", { name: "Change theme" })).toBeInTheDocument();
    for (const b of screen.getAllByRole("button")) expect(b).toHaveAccessibleName();
  });

  it("has no axe violations", async () => {
    const { container } = setup();
    await expectNoA11yViolations(container);
  });
});
