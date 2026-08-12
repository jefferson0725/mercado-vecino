import { BadgeCheck, Clock3, XCircle } from "lucide-react";
import Form from "next/form";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/utils";
import { subscriptionStatus, graceEndsAt, expiresSoon } from "@/lib/subscription";
import { registerManualPayment } from "../actions";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";

const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

const URGENCIA = { vencida: 0, gracia: 1, activa: 2 } as const;

export default async function AdminSuscripcionesPage({
  searchParams,
}: {
  searchParams: Promise<{ conjuntoId?: string }>;
}) {
  const { conjuntoId } = await searchParams;

  const [conjuntos, businesses] = await Promise.all([
    prisma.conjunto.findMany({
      where: { monthlyPrice: { gt: 0 } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.business.findMany({
      where: {
        approved: true,
        conjunto: { monthlyPrice: { gt: 0 } },
        ...(conjuntoId ? { conjuntoId } : {}),
      },
      include: {
        conjunto: { select: { id: true, name: true, monthlyPrice: true } },
        owner: { select: { name: true, email: true } },
      },
      orderBy: [{ paidUntil: "asc" }],
    }),
  ]);

  const negocios = businesses
    .map((b) => ({
      ...b,
      estado: subscriptionStatus(b.paidUntil, b.conjunto.monthlyPrice),
    }))
    .filter((b) => b.estado !== "exenta")
    .sort((a, b) => URGENCIA[a.estado as keyof typeof URGENCIA] - URGENCIA[b.estado as keyof typeof URGENCIA]);

  const vencidas = negocios.filter((b) => b.estado === "vencida").length;
  const enGracia = negocios.filter((b) => b.estado === "gracia").length;
  const activas = negocios.filter((b) => b.estado === "activa").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Suscripciones</h2>
        <p className="mt-0.5 text-sm text-neutral-500">
          Negocios con plan de pago activo — sin contar conjuntos exentos.
        </p>
      </div>

      <Form action="/admin/suscripciones" className="flex gap-2">
        <label htmlFor="filtro-conjunto" className="sr-only">
          Filtrar por conjunto
        </label>
        <select
          id="filtro-conjunto"
          name="conjuntoId"
          defaultValue={conjuntoId ?? ""}
          className="min-h-10 flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
        >
          <option value="">Todos los conjuntos</option>
          {conjuntos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="min-h-10 shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong"
        >
          Filtrar
        </button>
        {conjuntoId && (
          <a
            href="/admin/suscripciones"
            className="inline-flex min-h-10 shrink-0 items-center rounded-xl border border-neutral-200 px-4 py-2 text-sm text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
          >
            Limpiar
          </a>
        )}
      </Form>

      <ul className="grid grid-cols-3 gap-3">
        <li className="rounded-2xl border border-danger/30 bg-danger-soft p-4 text-center">
          <p className="text-2xl font-bold text-danger">{vencidas}</p>
          <p className="text-xs font-medium text-danger">Vencidas</p>
        </li>
        <li className="rounded-2xl border border-warn-text/25 bg-warn-soft p-4 text-center">
          <p className="text-2xl font-bold text-warn-text">{enGracia}</p>
          <p className="text-xs font-medium text-warn-text">En gracia</p>
        </li>
        <li className="rounded-2xl border border-primary/25 bg-primary-faint p-4 text-center">
          <p className="text-2xl font-bold text-primary">{activas}</p>
          <p className="text-xs font-medium text-primary">Activas</p>
        </li>
      </ul>

      {negocios.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
          {conjuntoId
            ? "No hay negocios con plan de pago en este conjunto."
            : "No hay negocios con plan de pago registrados todavía."}
        </p>
      ) : (
        <ul className="space-y-3">
          {negocios.map((business) => {
            const porVencer =
              business.estado === "activa" &&
              business.paidUntil !== null &&
              expiresSoon(business.paidUntil);

            return (
              <li
                key={business.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-neutral-900">{business.name}</p>

                      {business.estado === "vencida" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
                          <XCircle aria-hidden className="h-3 w-3" />
                          Vencida
                        </span>
                      )}
                      {business.estado === "gracia" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn-text">
                          <Clock3 aria-hidden className="h-3 w-3" />
                          En gracia
                        </span>
                      )}
                      {business.estado === "activa" && !porVencer && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-strong">
                          <BadgeCheck aria-hidden className="h-3 w-3" />
                          Al día
                        </span>
                      )}
                      {porVencer && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn-text">
                          <Clock3 aria-hidden className="h-3 w-3" />
                          Por vencer
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-sm text-neutral-600">
                      {business.conjunto.name} · {business.owner.name} · {business.owner.email}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {formatCOP(business.conjunto.monthlyPrice)}/mes ·{" "}
                      {business.paidUntil ? (
                        <>
                          vigente hasta el {fecha.format(business.paidUntil)}
                          {business.estado === "gracia" && (
                            <> · gracia hasta el {fecha.format(graceEndsAt(business.paidUntil))}</>
                          )}
                        </>
                      ) : (
                        "sin vigencia registrada"
                      )}
                    </p>
                  </div>

                  <form action={registerManualPayment}>
                    <input type="hidden" name="id" value={business.id} />
                    <ConfirmSubmit
                      message={`¿Registrar 1 mes de pago manual para "${business.name}"?`}
                      successMessage="Pago manual registrado (+1 mes)"
                      className="shrink-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-primary/50 hover:text-primary"
                    >
                      +1 mes manual
                    </ConfirmSubmit>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
