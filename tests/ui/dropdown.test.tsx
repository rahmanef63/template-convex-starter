// The disclosure primitive every menu in the shell is built on. What's tested is
// the contract a refactor could silently break: the aria wiring, and that focus
// comes back to the trigger on close (except after an outside click, which must
// leave focus where the user put it).
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dropdown, DropdownItem } from "@/components/os/dropdown";
import { expectNoA11yViolations } from "./axe";

function setup(onClose?: () => void) {
  const picked = vi.fn();
  const view = render(
    <div>
      <button type="button">outside</button>
      <Dropdown label="Account menu" trigger={<span>Account</span>} onClose={onClose}>
        {(close) => (
          <>
            <DropdownItem current onClick={() => picked("first")}>
              First
            </DropdownItem>
            <DropdownItem onClick={close}>Close me</DropdownItem>
            <DropdownItem disabled>Unavailable</DropdownItem>
          </>
        )}
      </Dropdown>
    </div>,
  );
  return { ...view, picked, user: userEvent.setup() };
}

const trigger = () => screen.getByRole("button", { name: "Account menu" });

describe("Dropdown", () => {
  it("starts closed and announces collapsed state", () => {
    setup();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).not.toHaveAttribute("aria-controls");
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("points aria-controls at the panel it actually renders", async () => {
    const { user } = setup();
    await user.click(trigger());
    const panel = screen.getByRole("group", { name: "Account menu" });
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("aria-controls", panel.id);
    expect(panel.id).toBeTruthy();
  });

  it("marks the current row so the state is not carried by the icon colour alone", async () => {
    const { user } = setup();
    await user.click(trigger());
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Close me" })).not.toHaveAttribute("aria-current");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const onClose = vi.fn();
    const { user } = setup(onClose);
    await user.click(trigger());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("returns focus to the trigger when an item closes the panel", async () => {
    const { user } = setup();
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Close me" }));
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("does NOT yank focus back when an outside click closed it", async () => {
    const { user } = setup();
    await user.click(trigger());
    const outside = screen.getByRole("button", { name: "outside" });
    await user.click(outside);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(outside).toHaveFocus();
  });

  it("keeps disabled rows out of the tab order and unclickable", async () => {
    const { user, picked } = setup();
    await user.click(trigger());
    const unavailable = screen.getByRole("button", { name: "Unavailable" });
    expect(unavailable).toBeDisabled();
    await user.click(unavailable);
    expect(picked).not.toHaveBeenCalled();
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("has no axe violations when open", async () => {
    const { container, user } = setup();
    await user.click(trigger());
    await expectNoA11yViolations(container);
  });
});
