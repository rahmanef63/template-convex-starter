// The placeholder screens plus the slug → screen routing. Notes and Assistant
// are excluded on purpose: they need a Convex provider, and their own auth
// behaviour is covered by the backend suite.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardScreen, Screen, SettingsScreen } from "@/components/os/screens";
import { WORKSPACES, splitFeatures } from "@/components/os/menu";
import { expectNoA11yViolations } from "./axe";

const { project, system } = splitFeatures(WORKSPACES[2]!.features);
const feature = project.find((m) => m.slug === "feature-2")!;
const billing = system.find((m) => m.slug === "billing")!;

describe("Screen routing", () => {
  it("sends project features to the dashboard and system features to settings", () => {
    const { unmount } = render(<Screen app={feature} />);
    expect(screen.getByRole("heading", { name: `${feature.label} — recent` })).toBeInTheDocument();
    unmount();

    render(<Screen app={billing} />);
    expect(screen.getByRole("heading", { name: "Preferences" })).toBeInTheDocument();
  });
});

describe("DashboardScreen", () => {
  it("names its recent list after the feature it is standing in for", () => {
    render(<DashboardScreen app={feature} />);
    expect(screen.getByRole("heading", { name: `${feature.label} — recent` })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("has no axe violations", async () => {
    const { container } = render(<DashboardScreen app={feature} />);
    await expectNoA11yViolations(container);
  });
});

describe("SettingsScreen", () => {
  it("gives every control an accessible name, placeholder or not", () => {
    render(<SettingsScreen app={billing} />);
    expect(screen.getByRole("heading", { name: billing.label })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Workspace name" })).toBeDisabled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<SettingsScreen app={billing} />);
    await expectNoA11yViolations(container);
  });
});
