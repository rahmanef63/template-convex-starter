import type { Metadata } from "next";
import { OsRoute } from "./os-route";

export const metadata: Metadata = { title: "OS" };

export default function OsPage() {
  return <OsRoute />;
}
