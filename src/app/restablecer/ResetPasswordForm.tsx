"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { FormField, FormError } from "@/components/FormField";
import { SubmitButton } from "@/components/SubmitButton";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    if (error) {
      setError("No se pudo restablecer la contraseña. El enlace puede haber expirado.");
      return;
    }
    router.push("/login?restablecida=1");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <FormField
        label="Nueva contraseña"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint="Mínimo 8 caracteres"
      />
      <FormField
        label="Confirmar contraseña"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
      />

      <FormError error={error} />

      <SubmitButton pending={pending} pendingLabel="Guardando..." className="shadow-md shadow-primary/20">
        <KeyRound aria-hidden className="h-4.5 w-4.5" />
        Guardar nueva contraseña
      </SubmitButton>

      <p className="text-center text-sm text-neutral-500">
        <Link href="/login" className="hover:text-primary hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </form>
  );
}
