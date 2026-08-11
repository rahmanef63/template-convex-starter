import type { Metadata } from "next";
import { LoginClient } from "./login-client";

// Indexable on purpose — /login is in app/sitemap.ts. Every route declares its
// own canonical (the root layout sets none, so nothing is inherited by accident).
export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to your account, create a new one, or reset a forgotten password with an emailed code.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return <LoginClient />;
}
