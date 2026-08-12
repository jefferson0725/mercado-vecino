import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, Clock, Search, SearchX, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isOpenNow } from "@/lib/schedule";
import { publicBusinessWhere } from "@/lib/subscription";
import { PublicHeader } from "@/components/PublicHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ScrollRestorer } from "@/components/ScrollRestorer";
import { BackLink } from "@/components/BackLink";

async function getConjunto(
  slug: string,
  filtros: { busqueda?: string; categoriaSlug?: string }
) {
  const { busqueda, categoriaSlug } = filtros;
  return prisma.conjunto.findFirst({
    where: { slug, active: true },
    include: {
      businesses: {
        where: {
          ...publicBusinessWhere(),
          ...(busqueda ? { name: { contains: busqueda, mode: "insensitive" as const } } : {}),
          ...(categoriaSlug ? { categories: { some: { slug: categoriaSlug } } } : {}),
        },
        orderBy: { name: "asc" },
        take: 200,
        include: {
          categories: true,
          _count: { select: { products: { where: { available: true, moderatedOff: false } } } },
        },
      },
    },
  });
}

async function getCategoriasDelConjunto(slug: string) {
  return prisma.category.findMany({
    where: { businesses: { some: { conjunto: { slug, active: true }, ...publicBusinessWhere() } } },
    orderBy: { name: "asc" },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ conjunto: string }>;
}): Promise<Metadata> {
  const { conjunto: slug } = await params;
  const conjunto = await getConjunto(slug, {});
  if (!conjunto) return {};
  return {
    title: conjunto.name,
    description: `Los negocios de ${conjunto.name}: pide directo por WhatsApp.`,
  };
}

export const revalidate = 60;

function filterHref(slug: string, categoria?: string, abiertos?: boolean, q?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (categoria) params.set("categoria", categoria);
  if (abiertos) params.set("abiertos", "1");
  const query = params.toString();
  return `/${slug}${query ? `?${query}` : ""}`;
}

export default async function ConjuntoPage({
  params,
  searchParams,
}: {
  params: Promise<{ conjunto: string }>;
  searchParams: Promise<{ categoria?: string; abiertos?: string; q?: string }>;
}) {
  const [{ conjunto: slug }, { categoria: categoriaSlug, abiertos, q }] =
    await Promise.all([params, searchParams]);

  const soloAbiertos = abiertos === "1";
  const busqueda = typeof q === "string" ? q.trim() : "";

  const [conjunto, categoriasDelConjunto] = await Promise.all([
    getConjunto(slug, { busqueda, categoriaSlug }),
    getCategoriasDelConjunto(slug),
  ]);
  if (!conjunto) notFound();

  // Solo el filtro de abiertos se hace en JS porque depende de la hora
  const negocios = conjunto.businesses
    .map((b) => ({ ...b, abiertoAhora: isOpenNow(b) }))
    .filter((b) => (soloAbiertos ? b.abiertoAhora : true))
    .sort((a, b) => Number(b.abiertoAhora) - Number(a.abiertoAhora));

  const categoriaActiva = categoriaSlug
    ? (categoriasDelConjunto.find((c) => c.slug === categoriaSlug) ?? null)
    : null;

  const chipBase =
    "inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition";
  const chipOn = "border-primary bg-primary-soft text-primary-strong";
  const chipOff = "border-neutral-300 bg-white text-neutral-700 hover:border-primary/50";

  return (
    <>
      <ScrollRestorer />
      <PublicHeader />
      <main id="contenido" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <nav aria-label="Volver al inicio" className="mb-3">
          <BackLink href="/" label="Inicio" />
        </nav>
        <h1 className="font-display text-2xl font-bold text-neutral-900">{conjunto.name}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {negocios.length}{" "}
          {negocios.length === 1 ? "negocio" : "negocios"}
          {soloAbiertos || busqueda || categoriaActiva ? " con los filtros actuales" : " de tus vecinos"}
        </p>

        <Form action={`/${conjunto.slug}`} role="search" className="mt-4 flex gap-2">
          {categoriaActiva && (
            <input type="hidden" name="categoria" value={categoriaActiva.slug} />
          )}
          {soloAbiertos && <input type="hidden" name="abiertos" value="1" />}
          <label htmlFor="buscar-negocio" className="sr-only">
            Buscar negocio por nombre
          </label>
          <div className="relative w-full">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400"
            />
            <input
              id="buscar-negocio"
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

        {/* Chips de categorías + "Abiertos ahora". El toggle de hora se muestra
            siempre; los chips de categoría solo cuando hay categorías. */}
        <nav aria-label="Filtrar negocios" className="mt-4 flex flex-wrap gap-2">
            {categoriasDelConjunto.length > 0 && (
              <>
                <Link
                  href={filterHref(conjunto.slug, undefined, soloAbiertos, busqueda)}
                  aria-current={!categoriaActiva ? "true" : undefined}
                  className={`${chipBase} ${!categoriaActiva ? chipOn : chipOff}`}
                >
                  Todos
                </Link>
                {categoriasDelConjunto.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={filterHref(
                      conjunto.slug,
                      categoriaActiva?.slug === cat.slug ? undefined : cat.slug,
                      soloAbiertos,
                      busqueda
                    )}
                    aria-current={categoriaActiva?.slug === cat.slug ? "true" : undefined}
                    className={`${chipBase} ${categoriaActiva?.slug === cat.slug ? chipOn : chipOff}`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </>
            )}
            <Link
              href={filterHref(
                conjunto.slug,
                categoriaActiva ? categoriaActiva.slug : undefined,
                !soloAbiertos,
                busqueda
              )}
              aria-current={soloAbiertos ? "true" : undefined}
              className={`${chipBase} gap-1.5 ${soloAbiertos ? chipOn : chipOff}`}
            >
              <Clock aria-hidden className="h-3.5 w-3.5" />
              Abiertos ahora
            </Link>
        </nav>

        {negocios.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            {conjunto.businesses.length === 0 ? (
              <Store aria-hidden className="mx-auto h-8 w-8 text-neutral-400" />
            ) : (
              <SearchX aria-hidden className="mx-auto h-8 w-8 text-neutral-400" />
            )}
            <p className="mt-3 text-sm text-neutral-600">
              {conjunto.businesses.length === 0
                ? "Todavía no hay negocios en este conjunto. ¡Sé el primero!"
                : busqueda
                ? `Ningún negocio coincide con "${busqueda}". Prueba con otro nombre.`
                : "Ningún negocio coincide con el filtro. Prueba con otra categoría."}
            </p>
            {(busqueda || categoriaActiva || soloAbiertos) && (
              <Link
                href={`/${conjunto.slug}`}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Ver todos los negocios
              </Link>
            )}
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {negocios.map((business) => (
              <li key={business.id}>
                <Link
                  href={`/${conjunto.slug}/${business.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-primary/50 hover:shadow-sm"
                >
                  {business.logoUrl ? (
                    <Image
                      src={business.logoUrl}
                      alt={business.name}
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-xl border border-neutral-100 object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-lg font-bold text-primary-strong"
                    >
                      {business.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-neutral-900">{business.name}</p>
                      <StatusBadge isOpen={business.abiertoAhora} />
                    </div>
                    {business.description && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-neutral-600">
                        {business.description}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {business.categories.length > 0 && (
                        <>
                          {business.categories
                            .slice(0, 3)
                            .map((c) => c.name)
                            .join(" · ")}
                          {" — "}
                        </>
                      )}
                      {business._count.products}{" "}
                      {business._count.products === 1
                        ? "producto disponible"
                        : "productos disponibles"}
                    </p>
                  </div>
                  <ChevronRight
                    aria-hidden
                    className="h-5 w-5 shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
