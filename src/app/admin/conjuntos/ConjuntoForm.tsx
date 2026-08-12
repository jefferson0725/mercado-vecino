"use client";

import { useActionState } from "react";
import { createConjunto, type AdminFormState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormField, FormError } from "@/components/FormField";
import { useFormToast } from "@/lib/useFormToast";

const initialState: AdminFormState = {};

export function ConjuntoForm() {
  const [state, formAction] = useActionState(createConjunto, initialState);
  useFormToast(state, "Conjunto creado");

  return (
    <form action={formAction} className="space-y-3">
      <FormField
        label="Nombre del conjunto"
        name="name"
        placeholder="Torres del Parque"
        hint="El código de invitación se genera automáticamente"
        required
      />
      <FormField
        label="Suscripción mensual (COP)"
        name="monthlyPrice"
        type="number"
        min={0}
        step={1000}
        defaultValue={0}
        hint="Lo que paga cada negocio al mes por aparecer en el catálogo. 0 = gratis."
      />
      <FormError error={state.error} />
      <SubmitButton>Crear conjunto</SubmitButton>
    </form>
  );
}
