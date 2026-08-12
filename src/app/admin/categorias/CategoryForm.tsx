"use client";

import { useActionState } from "react";
import { type AdminFormState } from "../actions";
import { FormField, FormError } from "@/components/FormField";
import { SubmitButton } from "@/components/SubmitButton";
import { useFormToast } from "@/lib/useFormToast";

const initialState: AdminFormState = {};

export function CategoryForm({
  action,
}: {
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
}) {
  const [state, formAction] = useActionState(action, initialState);
  useFormToast(state, "Categoría creada");

  return (
    <form action={formAction} className="space-y-3">
      <FormField
        label="Nombre"
        name="name"
        placeholder="Ej: Artesanías"
        hint="El slug se genera automáticamente a partir del nombre."
        required
      />
      <FormError error={state.error} />
      <SubmitButton>Crear categoría</SubmitButton>
    </form>
  );
}
