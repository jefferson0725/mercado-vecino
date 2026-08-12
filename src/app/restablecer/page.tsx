import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function RestablecerPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  // El token llegó en la URL pero algo falló (ej. expirado / ya usado)
  if (error === "INVALID_TOKEN" || (!token && !error)) {
    return (
      <AuthShell
        title="Enlace inválido"
        subtitle="Este enlace para restablecer la contraseña no es válido o ya expiró."
      >
        <p className="mt-6 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          El enlace puede haber expirado (duran 1 hora) o ya fue utilizado.
        </p>
        <p className="mt-4 text-center text-sm text-neutral-600">
          <Link href="/recuperar" className="font-semibold text-primary hover:underline">
            Solicitar un nuevo enlace
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura para tu cuenta."
    >
      <ResetPasswordForm token={token!} />
    </AuthShell>
  );
}
