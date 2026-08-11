// The one fully-wired preference in the shell. Worth testing because the active
// option used to be signalled by an aria-hidden check icon and a colour — i.e.
// invisible to a screen reader — and because the hydration guard means the
// control only exists after mount.
import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemePicker } from "@/components/theme-picker";
import { ThemeProvider } from "@/components/theme-provider";
import { expectNoA11yViolations } from "./axe";

// next-themes reads the OS preference on mount; jsdom ships no matchMedia.
beforeAll(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addListener: () => {}, // next-themes still uses the legacy pair
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

function setup() {
  const view = render(
    <ThemeProvider>
      <ThemePicker />
    </ThemeProvider>,
  );
  return { ...view, user: userEvent.setup() };
}

describe("ThemePicker", () => {
  it("offers the three themes behind a named trigger", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Change theme" }));
    for (const label of ["Light", "Dark", "System"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the active theme in the accessibility tree, not just in colour", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Change theme" }));
    // defaultTheme="dark" — components/theme-provider.tsx.
    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Light" })).not.toHaveAttribute("aria-current");
  });

  it("switches theme and moves the marker with it", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Change theme" }));
    await user.click(screen.getByRole("button", { name: "Light" }));
    expect(document.documentElement).toHaveClass("light");

    await user.click(screen.getByRole("button", { name: "Change theme" }));
    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute("aria-current", "true");
  });

  it("has no axe violations when open", async () => {
    const { container, user } = setup();
    await user.click(screen.getByRole("button", { name: "Change theme" }));
    await expectNoA11yViolations(container);
  });
});
