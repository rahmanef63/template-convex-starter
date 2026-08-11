// The mutation-error channel. It has to announce (live region) and it has to
// clean up after itself — a leaked toast list is a memory + noise bug.
// fireEvent, not userEvent: userEvent's own internal waits deadlock against
// fake timers, and the 5s auto-dismiss is the whole point of this suite.
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "@/components/toast";
import { expectNoA11yViolations } from "./axe";

function Trigger({ message, variant }: { message: string; variant?: "info" | "error" }) {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast(message, variant ? { variant } : undefined)}>
      fire {message}
    </button>
  );
}

function setup(children: React.ReactNode) {
  vi.useFakeTimers();
  return render(<ToastProvider>{children}</ToastProvider>);
}

const fire = (message: string) =>
  fireEvent.click(screen.getByRole("button", { name: `fire ${message}` }));

afterEach(() => vi.useRealTimers());

describe("ToastProvider", () => {
  it("announces the message in a polite live region", () => {
    setup(<Trigger message="Saved." />);
    fire("Saved.");
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveTextContent("Saved.");
  });

  it("stacks several toasts and auto-dismisses each after 5s", () => {
    setup(
      <>
        <Trigger message="One." />
        <Trigger message="Two." variant="error" />
      </>,
    );
    fire("One.");
    fire("Two.");
    expect(screen.getByRole("status")).toHaveTextContent("One.Two.");

    act(() => void vi.advanceTimersByTime(4999));
    expect(screen.getByRole("status")).toHaveTextContent("One.Two.");
    act(() => void vi.advanceTimersByTime(1));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("refuses to work outside the provider instead of silently swallowing errors", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Trigger message="orphan" />)).toThrow(/ToastProvider/);
    quiet.mockRestore();
  });

  // Real timers here: axe.run schedules its own work and never resolves under
  // fake ones. The 5s dismissal is already covered above.
  it("has no axe violations with a toast up", async () => {
    const { container } = render(
      <ToastProvider>
        <Trigger message="Saved." />
      </ToastProvider>,
    );
    fire("Saved.");
    await expectNoA11yViolations(container);
  });
});
