"use client";

import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

export function SignOutButton() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut();
        router.push("/");
      }}
      className="btn-ghost"
    >
      Sign out
    </button>
  );
}
