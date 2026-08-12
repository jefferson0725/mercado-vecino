"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * Botón para acciones admin inline (Server Actions de una sola acción):
 * muestra spinner mientras está en vuelo y toast de éxito al terminar.
 * Usar cuando el formulario tiene un solo botón y la acción no devuelve estado.
 */
export function AdminActionButton({
  action,
  formData,
  children,
  successMessage,
  className = "",
  pendingLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  formData: Record<string, string>;
  children: React.ReactNode;
  successMessage: string;
  className?: string;
  pendingLabel?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const fd = new FormData();
    for (const [k, v] of Object.entries(formData)) fd.set(k, v);
    startTransition(async () => {
      await action(fd);
      toast.success(successMessage);
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      aria-busy={isPending}
      onClick={handleClick}
      className={`${className} disabled:opacity-60`}
    >
      {isPending ? (
        <span className="inline-flex items-center gap-1.5">
          <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
          {pendingLabel ?? "Un momento..."}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
