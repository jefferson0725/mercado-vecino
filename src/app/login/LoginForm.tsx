"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { FormField, FormError } from "@/components/FormField";
import { AuthShell } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error) {
      setError("Correo o contraseña incorrectos.");
      setPending(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell title="Inicia sesión" subtitle="Entra al panel de tu negocio.">
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          autoComplete="current-password"
          required
        />

        <FormError error={error} />
        <SubmitButton pending={pending} className="shadow-md shadow-primary/20">
          <LogIn aria-hidden className="h-4.5 w-4.5" />
          Entrar
        </SubmitButton>

        <p className="text-center text-sm text-neutral-500">
          <Link href="/recuperar" className="hover:text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-600">
        ¿Aún no tienes tu negocio?{" "}
        <Link href="/registro" className="font-semibold text-primary hover:underline">
          Regístrate con tu código
        </Link>
      </p>
    </AuthShell>
  );
}
