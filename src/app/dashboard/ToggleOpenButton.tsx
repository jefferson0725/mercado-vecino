"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

function Inner({ isOpen }: { isOpen: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white transition disabled:opacity-70 ${
        isOpen ? "bg-neutral-700 hover:bg-neutral-800" : "bg-primary hover:bg-primary-strong"
      }`}
    >
      {pending ? (
        <>
          <Loader2 aria-hidden className="h-4.5 w-4.5 animate-spin" />
          Un momento...
        </>
      ) : isOpen ? (
        "Cerrar negocio"
      ) : (
        "Abrir negocio"
      )}
    </button>
  );
}

export function ToggleOpenButton({
  action,
  isOpen,
}: {
  action: () => Promise<void>;
  isOpen: boolean;
}) {
  return (
    <form action={action} className="mt-4">
      <Inner isOpen={isOpen} />
    </form>
  );
}
