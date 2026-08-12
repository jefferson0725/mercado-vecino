"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { AuthShell } from "@/components/AuthShell";
import { FormField, FormError } from "@/components/FormField";
import { SubmitButton } from "@/components/SubmitButton";

export default function RecuperarPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setPending(true);
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/restablecer",
    });
    setPending(false);
    if (error) {
      setError("No se pudo enviar el correo. Intenta de nuevo.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell
        title="Revisa tu correo"
        subtitle="Te enviamos las instrucciones para recuperar tu contraseña."
      >
        <p className="mt-6 rounded-2xl border border-primary/20 bg-primary-faint px-4 py-3 text-sm text-neutral-700">
          Si el correo está registrado, recibirás un enlace en los próximos minutos.
          Revisa también la carpeta de spam.
        </p>
        <p className="mt-4 text-center text-sm text-neutral-500">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recupera tu contraseña"
      subtitle="Escribe tu correo y te enviamos un enlace para crear una nueva."
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <FormField
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="maria@correo.com"
          required
        />

        <FormError error={error} />

        <SubmitButton pending={pending} pendingLabel="Enviando..." className="shadow-md shadow-primary/20">
          <Mail aria-hidden className="h-4.5 w-4.5" />
          Enviar enlace
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-600">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </AuthShell>
  );
}
