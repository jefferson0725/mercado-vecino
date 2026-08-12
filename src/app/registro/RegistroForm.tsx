"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { registrarVendedor, type RegistroState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormField, FormError } from "@/components/FormField";
import { PhoneField } from "@/components/PhoneField";
import { AuthShell } from "@/components/AuthShell";
import { LIMITS } from "@/lib/config";

const initialState: RegistroState = {};

export function RegistroForm() {
  const [state, formAction] = useActionState(registrarVendedor, initialState);

  return (
    <AuthShell
      title="Crea tu negocio"
      subtitle="Necesitas el código de invitación de tu conjunto. Pídelo en el grupo de WhatsApp de tu conjunto residencial."
    >
      <form action={formAction} className="mt-6 space-y-4">
        <FormField
          label="Código de invitación"
          name="inviteCode"
          placeholder="EJ: TORRES-2026"
          required
          autoCapitalize="characters"
        />
        <FormField
          label="Tu nombre"
          name="name"
          autoComplete="name"
          placeholder="María Pérez"
          maxLength={LIMITS.userName}
          required
        />
        <FormField
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="maria@correo.com"
          required
        />
        <FormField
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          hint="Mínimo 8 caracteres"
          required
        />
        <FormField
          label="Nombre de tu negocio"
          name="businessName"
          placeholder="Donas de María"
          maxLength={LIMITS.businessName}
          required
        />
        <PhoneField
          label="WhatsApp para recibir pedidos"
          name="whatsapp"
          hint="El número donde te llegarán los pedidos"
          required
        />

        <FormError error={state.error} />
        <SubmitButton className="flex items-center justify-center gap-2 shadow-md shadow-primary/20">
          <Store aria-hidden className="h-4.5 w-4.5" />
          Crear mi negocio
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
