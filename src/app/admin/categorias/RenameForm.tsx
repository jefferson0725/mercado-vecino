"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { renameCategory } from "../actions";
import type { AdminFormState } from "../actions";
import { FormError } from "@/components/FormField";

const initialState: AdminFormState = {};

export function RenameForm({ id, currentName }: { id: string; currentName: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(renameCategory, initialState);
  const prevStateRef = useRef(state);

  useEffect(() => {
    if (prevStateRef.current === state) return;
    prevStateRef.current = state;
    if (state.success) {
      toast.success("Categoría renombrada");
      setOpen(false);
    }
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-neutral-600 hover:text-neutral-900"
      >
        Renombrar
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex items-center gap-2">
        <input
          name="name"
          defaultValue={currentName}
          autoFocus
          className="min-h-9 flex-1 rounded-xl border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
        <button
          type="submit"
          className="min-h-9 rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-9 rounded-xl border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100"
        >
          Cancelar
        </button>
      </div>
      <FormError error={state.error} />
    </form>
  );
}
