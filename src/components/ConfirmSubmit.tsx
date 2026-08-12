"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export function ConfirmSubmit({
  message,
  className,
  children,
  successMessage,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
  /** Si se indica, dispara un toast.success al enviar el formulario. */
  successMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    formRef.current = (e.currentTarget as HTMLElement).closest("form");
    setOpen(true);
  }

  function handleConfirm() {
    setOpen(false);
    formRef.current?.requestSubmit();
    if (successMessage) toast.success(successMessage);
  }

  return (
    <>
      <button type="button" className={className} onClick={handleClick}>
        {children}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar acción"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-neutral-900">{message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-10 rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="min-h-10 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
