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
      className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:text-white"
    >
      Sign out
    </button>
  );
}
