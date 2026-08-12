import Link from "next/link";
import { CheckCircle2, UserCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isOpenNow } from "@/lib/schedule";
import { approveBusiness, rejectBusiness } from "./actions";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { AdminActionButton } from "@/components/AdminActionButton";

const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

export default async function AdminInicioPage() {
  const [
    conjuntosActivos,
    conjuntosTotal,
    negociosActivos,
    negociosTotal,
    productosDisponibles,
    productosTotal,
    usuariosTotal,
    negociosEnMora,
    negociosConHorario,
    negociosPendientes,
    ultimosUsuarios,
    ultimosNegocios,
  ] = await Promise.all([
    prisma.conjunto.count({ where: { active: true } }),
    prisma.conjunto.count(),
    prisma.business.count({ where: { active: true, approved: true } }),
    prisma.business.count(),
    prisma.product.count({ where: { available: true } }),
    prisma.product.count(),
    prisma.user.count(),
    // Suscripción vencida (incluye los días de gracia): dejaron de pagar
    prisma.business.count({
      where: {
        approved: true,
        active: true,
        conjunto: { monthlyPrice: { gt: 0 } },
        OR: [{ paidUntil: null }, { paidUntil: { lte: new Date() } }],
      },
    }),
    // El estado "abierto ahora" es derivado del horario: se calcula aquí, no en la BD
    prisma.business.findMany({
      where: { active: true, approved: true },
      select: { isOpen: true, opensAt: true, closesAt: true, openDays: true },
      take: 500,
    }),
    prisma.business.findMany({
      where: { approved: false },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: {
        owner: { select: { name: true, email: true } },
        conjunto: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        business: { select: { id: true, name: true } },
      },
    }),
    prisma.business.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        conjuntoId: true,
        createdAt: true,
        conjunto: { select: { name: true } },
      },
    }),
  ]);

  const abiertosAhora = negociosConHorario.filter(isOpenNow).length;

  const metricas: {
    label: string;
    value: number;
    detail: string;
    href: string;
    tone?: "danger";
  }[] = [
    {
      label: "Conjuntos activos",
      value: conjuntosActivos,
      detail: `de ${conjuntosTotal} en total`,
      href: "/admin/conjuntos",
    },
    {
      label: "Negocios activos",
      value: negociosActivos,
      detail: `de ${negociosTotal} en total`,
      href: "/admin/conjuntos",
    },
    {
      label: "Abiertos ahora",
      value: abiertosAhora,
      detail: abiertosAhora === 1 ? "negocio atendiendo" : "negocios atendiendo",
      href: "/admin/conjuntos",
    },
    {
      label: "Productos disponibles",
      value: productosDisponibles,
      detail: `de ${productosTotal} en total`,
      href: "/admin/productos",
    },
    {
      label: "Usuarios registrados",
      value: usuariosTotal,
      detail: "vendedores y admins",
      href: "/admin/usuarios",
    },
    {
      label: "Suscripciones en mora",
      value: negociosEnMora,
      detail: negociosEnMora === 1 ? "negocio sin pagar" : "negocios sin pagar",
      href: "/admin/suscripciones",
      tone: negociosEnMora > 0 ? "danger" : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <section aria-labelledby="pendientes-titulo" className="space-y-3">
        <h2 id="pendientes-titulo" className="flex items-center gap-2 font-semibold">
          <UserCheck aria-hidden className="h-4.5 w-4.5 text-warn-text" />
          Pendientes de aprobación
          {negociosPendientes.length > 0 && (
            <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn-text">
              {negociosPendientes.length}
            </span>
          )}
        </h2>

        {negociosPendientes.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-3">
            <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-neutral-600">Sin aprobaciones pendientes.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {negociosPendientes.map((business) => (
              <li
                key={business.id}
                className="rounded-2xl border border-warn-text/25 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900">
                      {business.name}
                      <span className="ml-2 text-sm font-normal text-neutral-500">
                        {business.conjunto.name}
                      </span>
                    </p>
                    <p className="mt-0.5 break-all text-sm text-neutral-600">
                      {business.owner.name} · {business.owner.email} · WA {business.whatsappNumber}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-neutral-500">{fecha.format(business.createdAt)}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <AdminActionButton
                    action={approveBusiness}
                    formData={{ id: business.id }}
                    successMessage={`"${business.name}" aprobado`}
                    className="min-h-10 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong"
                  >
                    Aprobar
                  </AdminActionButton>
                  <form action={rejectBusiness}>
                    <input type="hidden" name="id" value={business.id} />
                    <ConfirmSubmit
                      message={`¿Rechazar y eliminar "${business.name}"? Esta acción no se puede deshacer.`}
                      successMessage={`"${business.name}" rechazado y eliminado`}
                      className="min-h-10 rounded-xl border border-danger/40 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger-soft"
                    >
                      Rechazar y eliminar
                    </ConfirmSubmit>
                  </form>
                  <Link
                    href={`/admin/conjuntos/${business.conjuntoId}/${business.id}`}
                    className="min-h-10 content-center text-sm font-medium text-primary hover:underline"
                  >
                    Ver detalle →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Métricas del marketplace">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metricas.map((metrica) => (
            <li key={metrica.label}>
              <Link
                href={metrica.href}
                className={`block h-full rounded-2xl border p-4 transition hover:shadow-sm ${
                  metrica.tone === "danger"
                    ? "border-danger/40 bg-danger-soft hover:border-danger/60"
                    : "border-neutral-200 bg-white hover:border-primary/50"
                }`}
              >
                <p className={`text-2xl font-bold ${metrica.tone === "danger" ? "text-danger" : "text-neutral-900"}`}>
                  {metrica.value}
                </p>
                <p className={`text-sm font-medium ${metrica.tone === "danger" ? "text-danger" : "text-neutral-700"}`}>
                  {metrica.label}
                </p>
                <p className={`text-xs ${metrica.tone === "danger" ? "text-danger/70" : "text-neutral-500"}`}>
                  {metrica.detail}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Usuarios recientes</h2>
        {ultimosUsuarios.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
            Todavía no hay usuarios registrados.
          </p>
        ) : (
          <ul className="space-y-2">
            {ultimosUsuarios.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900">
                    {user.name}
                    {user.role === "ADMIN" && (
                      <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-strong">
                        Admin
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-neutral-600">
                    {user.email}
                    {user.business && ` · ${user.business.name}`}
                  </p>
                </div>
                <p className="text-xs text-neutral-500">{fecha.format(user.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/usuarios" className="inline-block text-sm font-medium text-primary hover:underline">
          Ver todos los usuarios →
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Negocios recientes</h2>
        {ultimosNegocios.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
            Todavía no hay negocios registrados.
          </p>
        ) : (
          <ul className="space-y-2">
            {ultimosNegocios.map((business) => (
              <li
                key={business.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/conjuntos/${business.conjuntoId}`}
                    className="truncate font-medium text-neutral-900 hover:underline"
                  >
                    {business.name}
                  </Link>
                  <p className="truncate text-sm text-neutral-600">{business.conjunto.name}</p>
                </div>
                <p className="text-xs text-neutral-500">{fecha.format(business.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
