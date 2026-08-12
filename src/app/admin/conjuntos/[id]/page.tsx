import Link from "next/link";
import Form from "next/form";
import { notFound } from "next/navigation";
import { Clock, Search, SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { BackLink } from "@/components/BackLink";
import { isOpenNow } from "@/lib/schedule";
import { subscriptionStatus } from "@/lib/subscription";
import { MANUAL_PAYMENT } from "@/lib/config";
import {
  approveBusiness,
  registerManualPayment,
  rejectBusiness,
  toggleBusinessActive,
} from "../../actions";
import { ConjuntoTransferForm } from "../ConjuntoTransferForm";
import type { Prisma } from "@/generated/prisma/client";

const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

type Filtros = {
  q?: string;
  estado?: string;
  categoria?: string;
  abiertos?: boolean;
};

function filterHref(id: string, { q, estado, categoria, abiertos }: Filtros) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (estado) params.set("estado", estado);
  if (categoria) params.set("categoria", categoria);
  if (abiertos) params.set("abiertos", "1");
  const query = params.toString();
  return `/admin/conjuntos/${id}${query ? `?${query}` : ""}`;
}

export default async function AdminConjuntoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; estado?: string; categoria?: string; abiertos?: string }>;
}) {
  const [{ id }, { q, estado, categoria, abiertos }] = await Promise.all([params, searchParams]);

  const busqueda = typeof q === "string" ? q.trim() : "";
  const estadoActivo = estado === "activos" || estado === "inactivos" ? estado : undefined;
  const soloAbiertos = abiertos === "1";

  const where: Prisma.BusinessWhereInput = {
    conjuntoId: id,
    ...(busqueda && { name: { contains: busqueda, mode: "insensitive" as const } }),
    ...(estadoActivo && { active: estadoActivo === "activos" }),
    ...(categoria && { categories: { some: { slug: categoria } } }),
  };

  const [conjunto, businesses, categorias] = await Promise.all([
    prisma.conjunto.findUnique({
      where: { id },
      include: { _count: { select: { businesses: true } } },
    }),
    prisma.business.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 200,
      include: {
        owner: { select: { name: true, email: true } },
        _count: { select: { products: true } },
      },
    }),
    // Chips sobre todas las categorías del conjunto (sin aplicar filtros),
    // para que no desaparezcan al filtrar
    prisma.category.findMany({
      where: { businesses: { some: { conjuntoId: id } } },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!conjunto) notFound();

  // El estado abierto depende de la hora: se calcula aquí, en cada render
  const negocios = businesses
    .map((business) => ({
      ...business,
      abiertoAhora: isOpenNow(business),
      suscripcion: business.approved
        ? subscriptionStatus(business.paidUntil, conjunto.monthlyPrice)
        : null,
    }))
    .filter((b) => (soloAbiertos ? b.abiertoAhora : true));

  const hayFiltros = Boolean(busqueda || estadoActivo || categoria || soloAbiertos);
  const filtros: Filtros = {
    q: busqueda || undefined,
    estado: estadoActivo,
    categoria: categoria || undefined,
    abiertos: soloAbiertos,
  };

  const chipBase =
    "inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition";
  const chipOn = "border-primary bg-primary-soft text-primary-strong";
  const chipOff = "border-neutral-300 bg-white text-neutral-700 hover:border-primary/50";

  return (
    <div className="space-y-4">
      <nav aria-label="Volver a conjuntos">
        <BackLink href="/admin/conjuntos" label="Conjuntos" />
      </nav>
      <h2 className="text-lg font-semibold">
        {conjunto.name}{" "}
        <span className="font-normal text-neutral-500">
          · {conjunto._count.businesses}{" "}
          {conjunto._count.businesses === 1 ? "negocio" : "negocios"}
        </span>
      </h2>

      {conjunto.monthlyPrice > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="font-semibold text-neutral-900">Datos para pago por transferencia</h3>
          <p className="mt-0.5 text-sm text-neutral-600">
            Estos datos aparecen en el panel del vendedor cuando va a pagar su suscripción.
          </p>
          <ConjuntoTransferForm
            conjuntoId={conjunto.id}
            transferMethod={conjunto.transferMethod ?? MANUAL_PAYMENT.method}
            transferAccount={conjunto.transferAccount ?? MANUAL_PAYMENT.account}
            transferHolder={conjunto.transferHolder ?? MANUAL_PAYMENT.holder}
            transferKey={conjunto.transferKey ?? ""}
            transferWhatsapp={conjunto.transferWhatsapp ?? ""}
          />
        </section>
      )}

      {conjunto._count.businesses === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          Todavía nadie se registra en este conjunto. Comparte el código{" "}
          <code className="font-semibold">{conjunto.inviteCode}</code> en el grupo.
        </p>
      ) : (
        <>
          <Form action={`/admin/conjuntos/${conjunto.id}`} role="search" className="flex gap-2">
            {estadoActivo && <input type="hidden" name="estado" value={estadoActivo} />}
            {categoria && <input type="hidden" name="categoria" value={categoria} />}
            {soloAbiertos && <input type="hidden" name="abiertos" value="1" />}
            <label htmlFor="buscar-negocio-admin" className="sr-only">
              Buscar negocio por nombre
            </label>
            <div className="relative w-full">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400"
              />
              <input
                id="buscar-negocio-admin"
                type="search"
                name="q"
                defaultValue={busqueda}
                placeholder="Buscar negocio..."
                className="min-h-11 w-full rounded-xl border border-neutral-300 bg-white py-2.5 pr-3 pl-10 text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </div>
            <button
              type="submit"
              className="min-h-11 shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
            >
              Buscar
            </button>
          </Form>

          <nav aria-label="Filtrar negocios" className="flex flex-wrap gap-2">
            <Link
              href={filterHref(conjunto.id, { ...filtros, estado: undefined, categoria: undefined, abiertos: false })}
              aria-current={!estadoActivo && !categoria && !soloAbiertos ? "true" : undefined}
              className={`${chipBase} ${!estadoActivo && !categoria && !soloAbiertos ? chipOn : chipOff}`}
            >
              Todos
            </Link>
            <Link
              href={filterHref(conjunto.id, {
                ...filtros,
                estado: estadoActivo === "activos" ? undefined : "activos",
              })}
              aria-current={estadoActivo === "activos" ? "true" : undefined}
              className={`${chipBase} ${estadoActivo === "activos" ? chipOn : chipOff}`}
            >
              Activos
            </Link>
            <Link
              href={filterHref(conjunto.id, {
                ...filtros,
                estado: estadoActivo === "inactivos" ? undefined : "inactivos",
              })}
              aria-current={estadoActivo === "inactivos" ? "true" : undefined}
              className={`${chipBase} ${estadoActivo === "inactivos" ? chipOn : chipOff}`}
            >
              Desactivados
            </Link>
            {categorias.map((cat) => (
              <Link
                key={cat.slug}
                href={filterHref(conjunto.id, {
                  ...filtros,
                  categoria: categoria === cat.slug ? undefined : cat.slug,
                })}
                aria-current={categoria === cat.slug ? "true" : undefined}
                className={`${chipBase} ${categoria === cat.slug ? chipOn : chipOff}`}
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href={filterHref(conjunto.id, { ...filtros, abiertos: !soloAbiertos })}
              aria-current={soloAbiertos ? "true" : undefined}
              className={`${chipBase} gap-1.5 ${soloAbiertos ? chipOn : chipOff}`}
            >
              <Clock aria-hidden className="h-3.5 w-3.5" />
              Abiertos ahora
            </Link>
          </nav>
        </>
      )}

      {conjunto._count.businesses > 0 && negocios.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <SearchX aria-hidden className="mx-auto h-8 w-8 text-neutral-400" />
          <p className="mt-3 text-sm text-neutral-600">
            {busqueda
              ? `Ningún negocio coincide con "${busqueda}".`
              : "Ningún negocio coincide con el filtro."}
            {hayFiltros && (
              <>
                {" "}
                <Link
                  href={`/admin/conjuntos/${conjunto.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  Quitar filtros
                </Link>
              </>
            )}
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {negocios.map((business) => (
          <li
            key={business.id}
            className={`rounded-2xl border border-neutral-200 bg-white p-4 ${
              business.active ? "" : "opacity-60"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{business.name}</p>
              <StatusBadge isOpen={business.abiertoAhora} />
              {!business.approved && (
                <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn-text">
                  Pendiente de aprobación
                </span>
              )}
              {business.suscripcion === "gracia" && (
                <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn-text">
                  Suscripción en gracia
                </span>
              )}
              {business.suscripcion === "vencida" && (
                <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
                  Suscripción vencida
                </span>
              )}
              {!business.active && (
                <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
                  Desactivado
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-600">
              {business.owner.name} · {business.owner.email} · WhatsApp {business.whatsappNumber}{" "}
              · {business._count.products} productos
              {business.suscripcion === "activa" && business.paidUntil && (
                <> · al día hasta el {fecha.format(business.paidUntil)}</>
              )}
            </p>
            <div className="mt-2 flex gap-4 text-sm">
              <Link
                href={`/admin/conjuntos/${conjunto.id}/${business.id}`}
                className="font-medium text-primary hover:underline"
              >
                Ver productos
              </Link>
              {business.approved ? (
                <>
                  {business.suscripcion && business.suscripcion !== "exenta" && (
                    <form action={registerManualPayment}>
                      <input type="hidden" name="id" value={business.id} />
                      <button type="submit" className="text-neutral-600 hover:text-neutral-900">
                        Registrar pago (+1 mes)
                      </button>
                    </form>
                  )}
                  <form action={toggleBusinessActive}>
                    <input type="hidden" name="id" value={business.id} />
                    <button
                      type="submit"
                      className={
                        business.active
                          ? "text-neutral-600 hover:text-danger"
                          : "text-primary hover:underline"
                      }
                    >
                      {business.active ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <form action={approveBusiness}>
                    <input type="hidden" name="id" value={business.id} />
                    <button type="submit" className="font-medium text-primary hover:underline">
                      Aprobar negocio
                    </button>
                  </form>
                  <form action={rejectBusiness}>
                    <input type="hidden" name="id" value={business.id} />
                    <button type="submit" className="text-neutral-600 hover:text-danger">
                      Rechazar y eliminar
                    </button>
                  </form>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
