import type { Metadata } from "next";
import { AssistantClient } from "./assistant-client";

export const metadata: Metadata = { title: "Assistant" };

export default function AssistantPage() {
  return <AssistantClient />;
}
