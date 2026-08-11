// The most stateful component in the repo. The invariant worth guarding is the
// `manage` prop: without it (the logged-out /os demo) the menu must be
// switch-only — no create, no rename, no delete — because those map 1:1 to
// authenticated Convex mutations.
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceSwitcher, type WorkspaceManage } from "@/components/os/workspace-switcher";
import { WORKSPACES } from "@/components/os/menu";
import { expectNoA11yViolations } from "./axe";

const [acme, monsters] = WORKSPACES;

function setup({
  manage,
  workspaces = WORKSPACES,
  activeId = acme!.id,
}: { manage?: WorkspaceManage; workspaces?: typeof WORKSPACES; activeId?: string } = {}) {
  const onChange = vi.fn();
  const view = render(
    <WorkspaceSwitcher workspaces={workspaces} activeId={activeId} onChange={onChange} manage={manage} />,
  );
  return { ...view, onChange, user: userEvent.setup() };
}

function stubManage(): WorkspaceManage & { [K in keyof WorkspaceManage]: ReturnType<typeof vi.fn> } {
  return {
    onCreate: vi.fn(async () => "new-workspace-id"),
    onRename: vi.fn(async () => {}),
    onDelete: vi.fn(async () => {}),
  };
}

// The trigger's accessible name has to contain the visible workspace name.
const trigger = (name = acme!.name) => screen.getByRole("button", { name: `Switch workspace — ${name}` });

describe("WorkspaceSwitcher — switching", () => {
  it("lists every workspace and flags the active one", async () => {
    const { user } = setup();
    await user.click(trigger());
    for (const w of WORKSPACES) expect(screen.getByRole("button", { name: w.name })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: acme!.name })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: monsters!.name })).not.toHaveAttribute("aria-current");
  });

  it("switches and closes when another workspace is picked", async () => {
    const { user, onChange } = setup();
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: monsters!.name }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(monsters!.id);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("falls back to the first workspace when activeId matches nothing", () => {
    setup({ activeId: "deleted-id" });
    expect(trigger()).toBeInTheDocument();
  });

  it("renders nothing rather than crashing on an empty workspace list", () => {
    const { container } = setup({ workspaces: [] });
    expect(container).toBeEmptyDOMElement();
  });
});

describe("WorkspaceSwitcher — without `manage` (logged-out demo)", () => {
  it("offers no create / rename / delete at all", async () => {
    const { user } = setup();
    await user.click(trigger());
    expect(screen.getByRole("button", { name: "Add workspace" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /^Rename/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Delete/ })).not.toBeInTheDocument();
  });

  it("has no axe violations when open", async () => {
    const { container, user } = setup();
    await user.click(trigger());
    await expectNoA11yViolations(container);
  });
});

describe("WorkspaceSwitcher — with `manage` (signed in)", () => {
  it("creates a workspace and switches to the id the mutation returned", async () => {
    const manage = stubManage();
    const { user, onChange } = setup({ manage });
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Add workspace" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledExactlyOnceWith("new-workspace-id"));
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("renames through the inline form, prefilled with the current name", async () => {
    const manage = stubManage();
    const { user } = setup({ manage });
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: `Rename “${acme!.name}”` }));

    const input = screen.getByRole("textbox", { name: "Workspace name" });
    expect(input).toHaveValue(acme!.name);
    await user.clear(input);
    await user.type(input, "  Renamed Inc  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(manage.onRename).toHaveBeenCalledExactlyOnceWith(acme!.id, "Renamed Inc"));
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("refuses to save a blank rename", async () => {
    const manage = stubManage();
    const { user } = setup({ manage });
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: `Rename “${acme!.name}”` }));
    await user.clear(screen.getByRole("textbox", { name: "Workspace name" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(manage.onRename).not.toHaveBeenCalled();
  });

  it("asks before deleting, then hands the user to another workspace", async () => {
    const manage = stubManage();
    const { user, onChange } = setup({ manage });
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: `Delete “${acme!.name}”` }));
    expect(manage.onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(manage.onDelete).toHaveBeenCalledExactlyOnceWith(acme!.id));
    // Deleting the active workspace must move the shell somewhere real.
    expect(onChange).toHaveBeenCalledExactlyOnceWith(monsters!.id);
  });

  it("backs out of the delete confirmation without calling the mutation", async () => {
    const manage = stubManage();
    const { user } = setup({ manage });
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: `Delete “${acme!.name}”` }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Add workspace" })).toBeInTheDocument();
    expect(manage.onDelete).not.toHaveBeenCalled();
  });

  it("won't let you delete your last workspace", async () => {
    const manage = stubManage();
    const { user } = setup({ manage, workspaces: [acme!] });
    await user.click(trigger());
    expect(screen.getByRole("button", { name: `Delete “${acme!.name}”` })).toBeDisabled();
  });

  it("resets to the list view when the menu is closed mid-rename", async () => {
    const manage = stubManage();
    const { user } = setup({ manage });
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: `Rename “${acme!.name}”` }));
    await user.keyboard("{Escape}");
    await user.click(trigger());
    expect(screen.queryByRole("textbox", { name: "Workspace name" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add workspace" })).toBeInTheDocument();
  });

  it("keeps the rename form open when the mutation fails", async () => {
    const manage = stubManage();
    manage.onRename.mockRejectedValueOnce(new Error("nope"));
    const { user } = setup({ manage });
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: `Rename “${acme!.name}”` }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(manage.onRename).toHaveBeenCalled());
    expect(screen.getByRole("textbox", { name: "Workspace name" })).toBeInTheDocument();
  });

  it("has no axe violations across list, rename, and confirm views", async () => {
    const manage = stubManage();
    const { container, user } = setup({ manage });
    await user.click(trigger());
    await expectNoA11yViolations(container);
    await user.click(screen.getByRole("button", { name: `Rename “${acme!.name}”` }));
    await expectNoA11yViolations(container);
    await user.keyboard("{Escape}");
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: `Delete “${acme!.name}”` }));
    await expectNoA11yViolations(container);
  });
});
