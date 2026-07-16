import type { Metadata } from "next";
import { OsShell } from "./os-shell";

export const metadata: Metadata = { title: "OS" };

export default function OsPage() {
  return <OsShell />;
}
