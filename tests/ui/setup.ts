// Setup for the `ui` project only (vitest.config.mts → projects[1].setupFiles).
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Testing Library only auto-cleans when a GLOBAL `afterEach` exists; this repo
// runs with `globals: false`, so wire it up explicitly or the DOM leaks between
// tests and role queries start matching the previous case's markup.
afterEach(cleanup);
