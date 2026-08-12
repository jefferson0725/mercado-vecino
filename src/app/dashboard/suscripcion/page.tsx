import { BadgeCheck, Clock3, CreditCard, Gift, HandCoins, MessageCircle } from "lucide-react";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatCOP, waLink } from "@/lib/utils";
import { MANUAL_PAYMENT, SUBSCRIPTION } from "@/lib/config";
import { graceEndsAt, subscriptionStatus } from "@/lib/subscription";
import { wompiEnabled } from "@/lib/wompi";
import { SubmitButton } from "@/components/SubmitButton";
import { WompiStatus } from "./WompiStatus";
import { payWithWompi } from "./actions";

const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "long" });

const METODO: Record<string, string> = { WOMPI: "Wompi", MANUAL: "Manual" };
const ESTADO_PAGO: Record<string, string> = {
  PENDING: "Sin completar",
  APPROVED: "Aprobado",
  DECLINED: "Rechazado",
  VOIDED: "Anulado",
  ERROR: "Error",
};

export default async function SuscripcionPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const [{ business }, { id: wompiRedirectId }] = await Promise.all([
    requireBusiness(),
    searchParams,
  ]);
  const price = business.conjunto.monthlyPrice;
  const estado = subscriptionStatus(business.paidUntil, price);

  const [payments, approvedPaymentCount] = await Promise.all([
    prisma.payment.findMany({
      where: {
        businessId: business.id,
        // PENDING es un estado interno de "sesión de checkout abierta"; no se
        // muestra en el historial porque no es un pago completado.
        status: { not: "PENDING" },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.payment.count({
      where: { businessId: business.id, status: "APPROVED" },
    }),
  ]);

  // Para el banner de confirmación sí necesitamos ver el PENDING reciente y el último estado terminal
  const [pendingWompi, lastWompiTerminal] = await Promise.all([
    prisma.payment.findFirst({
      where: {
        businessId: business.id,
        method: "WOMPI",
        status: "PENDING",
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      },
      select: { id: true },
    }),
    prisma.payment.findFirst({
      where: {
        businessId: business.id,
        method: "WOMPI",
        status: { in: ["DECLINED", "VOIDED", "ERROR"] },
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    }),
  ]);

  // Vuelta del checkout: el webhook es quien acredita; aquí solo se avisa.
  const confirmandoPago = Boolean(wompiRedirectId) && Boolean(pendingWompi);
  // Sin pagos aprobados: la vigencia proviene del trial gratuito.
  const enTrial = estado === "activa" && approvedPaymentCount === 0;

  return (
    <div className="space-y-6">
      <WompiStatus
        confirmando={confirmandoPago}
        lastWompiStatus={!confirmandoPago ? lastWompiTerminal?.status : null}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold text-neutral-900">Tu suscripción</h2>
        {estado === "exenta" ? (
          <p className="mt-2 text-sm text-neutral-600">
            En {business.conjunto.name} la vitrina no tiene costo por ahora. No tienes que
            pagar nada.
          </p>
        ) : (
          <>
            <p className="mt-0.5 text-sm text-neutral-600">
              {formatCOP(price)} al mes para aparecer en el catálogo de{" "}
              {business.conjunto.name}.
            </p>
            <div className="mt-3">
              {estado === "activa" && business.paidUntil && (
                <p className="flex items-center gap-2 rounded-xl bg-primary-faint px-4 py-3 text-sm font-medium text-primary-strong">
                  {enTrial ? (
                    <Gift aria-hidden className="h-4.5 w-4.5 shrink-0" />
                  ) : (
                    <BadgeCheck aria-hidden className="h-4.5 w-4.5 shrink-0" />
                  )}
                  {enTrial
                    ? `Prueba gratis hasta el ${fecha.format(business.paidUntil)} — ${SUBSCRIPTION.trialDays} días incluidos al registrarse.`
                    : `Al día: vigente hasta el ${fecha.format(business.paidUntil)}.`}
                </p>
              )}
              {estado === "gracia" && business.paidUntil && (
                <p className="flex items-center gap-2 rounded-xl bg-warn-soft px-4 py-3 text-sm font-medium text-warn-text">
                  <Clock3 aria-hidden className="h-4.5 w-4.5 shrink-0" />
                  Tu suscripción venció el {fecha.format(business.paidUntil)}. Tienes hasta
                  el {fecha.format(graceEndsAt(business.paidUntil))} para pagar antes de
                  salir del catálogo.
                </p>
              )}
              {estado === "vencida" && (
                <p className="flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                  <Clock3 aria-hidden className="h-4.5 w-4.5 shrink-0" />
                  Tu suscripción está vencida: tu negocio no aparece en el catálogo. Paga un
                  mes para volver a la vitrina de inmediato.
                </p>
              )}
            </div>

            {wompiEnabled() && (
              <form action={payWithWompi} className="mt-4">
                <SubmitButton className="gap-2 shadow-md shadow-primary/20">
                  <CreditCard aria-hidden className="h-5 w-5" />
                  Pagar {formatCOP(price)} con Wompi
                </SubmitButton>
                <p className="mt-2 text-center text-xs text-neutral-500">
                  Paga con Nequi, PSE, tarjeta o botón Bancolombia. Suma 1 mes a tu
                  vigencia.
                </p>
              </form>
            )}

            <div className="mt-4 rounded-xl border border-dashed border-neutral-300 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <HandCoins aria-hidden className="h-4.5 w-4.5 text-neutral-500" />
                ¿Prefieres pagar por transferencia?
              </h3>
              {business.conjunto.transferAccount && business.conjunto.transferHolder ? (
                <>
                  <p className="mt-1 text-sm text-neutral-600">
                    Transfiere {formatCOP(price)} a la{" "}
                    {business.conjunto.transferMethod ?? MANUAL_PAYMENT.method}{" "}
                    <span className="font-semibold text-neutral-900">
                      {business.conjunto.transferAccount}
                    </span>
                    {business.conjunto.transferKey && (
                      <>
                        {" · llave "}
                        <span className="font-semibold text-neutral-900">
                          {business.conjunto.transferKey}
                        </span>
                      </>
                    )}{" "}
                    a nombre de {business.conjunto.transferHolder}.{" "}
                    {business.conjunto.transferWhatsapp
                      ? "Envía el comprobante al administrador por WhatsApp."
                      : "Avisa al administrador para que registre tu pago."}{" "}
                    Tu vigencia se extiende cuando él lo confirme.
                  </p>
                  {business.conjunto.transferWhatsapp && (
                    <a
                      href={waLink(
                        business.conjunto.transferWhatsapp,
                        `Hola, acabo de hacer la transferencia de ${formatCOP(price)} para mi suscripción en ${business.conjunto.name}. Te envío el comprobante.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
                    >
                      <MessageCircle aria-hidden className="h-4.5 w-4.5 shrink-0" />
                      Enviar comprobante por WhatsApp
                    </a>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm text-neutral-500">
                  El administrador aún no ha configurado los datos de transferencia. Contáctalo
                  directamente para coordinar el pago.
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {payments.length > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="font-semibold text-neutral-900">Historial de pagos</h2>
          <ul className="mt-3 divide-y divide-neutral-100">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900">
                    {formatCOP(payment.amount)} · {METODO[payment.method]}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {fecha.format(payment.createdAt)}
                    {payment.note && ` · ${payment.note}`}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    payment.status === "APPROVED"
                      ? "bg-primary-soft text-primary-strong"
                      : payment.status === "PENDING"
                        ? "bg-neutral-100 text-neutral-600"
                        : "bg-danger-soft text-danger"
                  }`}
                >
                  {ESTADO_PAGO[payment.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-neutral-500">
        Al vencer tu vigencia tienes {SUBSCRIPTION.graceDays} días para pagar antes de que tu
        negocio deje de mostrarse en el catálogo. Al pagar, vuelve a aparecer de inmediato.
      </p>
    </div>
  );
}
