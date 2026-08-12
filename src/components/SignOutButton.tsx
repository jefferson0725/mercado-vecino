"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="rounded-lg px-2 py-1.5 text-sm text-neutral-600 transition hover:text-neutral-900"
    >
      Salir
    </button>
  );
}
