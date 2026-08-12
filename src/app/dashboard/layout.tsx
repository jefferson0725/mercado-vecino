import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireBusiness } from "@/lib/session";
import { subscriptionStatus, graceEndsAt, expiresSoon } from "@/lib/subscription";
import { SignOutButton } from "@/components/SignOutButton";
import { VerifyEmailBanner } from "@/components/VerifyEmailBanner";
import { DashboardNav } from "./DashboardNav";

const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "long" });

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, business } = await requireBusiness();

  const estado = subscriptionStatus(business.paidUntil, business.conjunto.monthlyPrice);
  const porVencer =
    estado === "activa" && business.paidUntil !== null && expiresSoon(business.paidUntil);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-display font-bold leading-tight">{business.name}</h1>
            {business.approved ? (
              <Link
                href={`/${business.conjunto.slug}/${business.slug}`}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
              >
                Ver mi página pública
                <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <p className="text-xs font-medium text-warn-text">Pendiente de aprobación</p>
            )}
          </div>
          <SignOutButton />
        </div>
        <DashboardNav />
      </header>
      <main id="contenido" className="mx-auto w-full max-w-3xl px-4 py-6">
        {/* Indicador de onboarding: dos pasos para aparecer en el catálogo */}
        {(!session.user.emailVerified || !business.approved) && (
          <div className="mb-6 rounded-2xl border border-warn-text/25 bg-warn-soft px-4 py-4">
            <p className="text-sm font-semibold text-warn-text">
              {!session.user.emailVerified && !business.approved
                ? "2 pasos para aparecer en el catálogo"
                : "1 paso para aparecer en el catálogo"}
            </p>
            <ul className="mt-2 space-y-1.5">
              {!session.user.emailVerified && (
                <li className="text-sm text-warn-text">
                  <VerifyEmailBanner email={session.user.email} inline />
                </li>
              )}
              {!business.approved && (
                <li className="text-sm text-warn-text">
                  ○ Esperando aprobación del administrador de {business.conjunto.name}.
                </li>
              )}
            </ul>
          </div>
        )}
        {business.approved && (porVencer || estado === "gracia") && business.paidUntil && (
          <p className="mb-6 rounded-2xl border border-warn-text/25 bg-warn-soft px-4 py-3 text-sm font-medium text-warn-text">
            {estado === "gracia"
              ? `Tu suscripción venció: tienes hasta el ${fecha.format(graceEndsAt(business.paidUntil))} para pagar antes de salir del catálogo. `
              : `Tu suscripción vence el ${fecha.format(business.paidUntil)}. `}
            <Link href="/dashboard/suscripcion" className="underline">
              Pagar ahora
            </Link>
          </p>
        )}
        {business.approved && estado === "vencida" && (
          <p className="mb-6 rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            Tu suscripción está vencida y tu negocio no aparece en el catálogo.{" "}
            <Link href="/dashboard/suscripcion" className="underline">
              Paga un mes
            </Link>{" "}
            para volver a la vitrina de inmediato.
          </p>
        )}
        {children}
      </main>
    </div>
  );
}
