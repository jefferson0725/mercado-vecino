"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * Botón de submit que se deshabilita automáticamente mientras el formulario
 * está en vuelo (via `useFormStatus`). Acepta un prop `pending` externo para
 * los casos donde el estado viene de `useState` en lugar de una Server Action.
 */
export function SubmitButton({
  children,
  className = "",
  pending: pendingProp,
  pendingLabel = "Un momento...",
}: {
  children: React.ReactNode;
  className?: string;
  /** Estado de carga externo (para formularios con `useState`/`useTransition`). */
  pending?: boolean;
  /** Texto que sustituye a `children` mientras está en vuelo. */
  pendingLabel?: string;
}) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingProp ?? formPending;
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-strong disabled:opacity-70 ${className}`}
    >
      {pending ? (
        <>
          <Loader2 aria-hidden className="h-4.5 w-4.5 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
