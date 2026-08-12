"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateConjuntoTransfer, type AdminFormState } from "../actions";
import { FormField, FormError } from "@/components/FormField";
import { SubmitButton } from "@/components/SubmitButton";

const initial: AdminFormState = {};

export function ConjuntoTransferForm({
  conjuntoId,
  transferMethod,
  transferAccount,
  transferHolder,
  transferKey,
  transferWhatsapp,
}: {
  conjuntoId: string;
  transferMethod: string;
  transferAccount: string;
  transferHolder: string;
  transferKey: string;
  transferWhatsapp: string;
}) {
  const [state, formAction] = useActionState(updateConjuntoTransfer, initial);

  useEffect(() => {
    if (state.success) toast.success("Datos de transferencia guardados");
  }, [state]);

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <input type="hidden" name="id" value={conjuntoId} />
      <FormField
        label="Tipo de cuenta"
        name="transferMethod"
        defaultValue={transferMethod}
        placeholder="cuenta de ahorros Nu"
        hint='Lo que aparece antes del número: p. ej. "cuenta de ahorros Nu"'
        required
      />
      <FormField
        label="Número de cuenta"
        name="transferAccount"
        defaultValue={transferAccount}
        placeholder="0000000000-0"
        required
      />
      <FormField
        label="Titular de la cuenta"
        name="transferHolder"
        defaultValue={transferHolder}
        placeholder="Nombre completo del titular"
        required
      />
      <FormField
        label="Llave (Nequi / Daviplata)"
        name="transferKey"
        defaultValue={transferKey}
        placeholder="3001234567"
        hint="Opcional. Si la tienes, aparece junto al número de cuenta."
      />
      <FormField
        label="WhatsApp para recibir comprobantes"
        name="transferWhatsapp"
        defaultValue={transferWhatsapp}
        placeholder="573001234567"
        hint="Número con código de país, sin + ni espacios. Opcional: si lo dejas vacío no aparece el botón."
      />
      <FormError error={state.error} />
      <SubmitButton>Guardar datos de transferencia</SubmitButton>
    </form>
  );
}
