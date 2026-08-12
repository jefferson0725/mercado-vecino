import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, PackageOpen, Tag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SITE_NAME } from "@/lib/config";
import { formatCOP, waLink, waProductMessage } from "@/lib/utils";
import { isOpenNow, describeSchedule } from "@/lib/schedule";
import { publicBusinessWhere } from "@/lib/subscription";
import { PublicHeader } from "@/components/PublicHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { BackLink } from "@/components/BackLink";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { ScrollRestorer } from "@/components/ScrollRestorer";

// El badge abierto/cerrado depende de la hora: regenerar como máximo cada minuto
export const revalidate = 60;

async function getBusiness(conjuntoSlug: string, negocioSlug: string) {
  const business = await prisma.business.findFirst({
    where: {
      slug: negocioSlug,
      conjunto: { slug: conjuntoSlug, active: true },
      ...publicBusinessWhere(),
    },
    include: {
      conjunto: { select: { id: true, name: true, slug: true } },
      categories: true,
      sections: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true } },
      products: {
        where: { moderatedOff: false },
        orderBy: [{ available: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        include: { section: { select: { id: true } } },
      },
    },
  });
  if (!business) return null;
  return { conjunto: business.conjunto, business };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ conjunto: string; negocio: string }>;
}): Promise<Metadata> {
  const { conjunto, negocio } = await params;
  const data = await getBusiness(conjunto, negocio);
  if (!data) return {};
  return {
    title: `${data.business.name} · ${data.conjunto.name}`,
    description: data.business.description || `Pide por WhatsApp en ${data.business.name}.`,
    openGraph: {
      title: data.business.name,
      description: data.business.description || `Pide por WhatsApp en ${data.business.name}.`,
      images: data.business.logoUrl ? [data.business.logoUrl] : undefined,
    },
  };
}

export default async function NegocioPage({
  params,
}: {
  params: Promise<{ conjunto: string; negocio: string }>;
}) {
  const { conjunto: conjuntoSlug, negocio: negocioSlug } = await params;
  const data = await getBusiness(conjuntoSlug, negocioSlug);
  if (!data) notFound();
  const { conjunto, business } = data;
  const abiertoAhora = isOpenNow(business);
  const horario = describeSchedule(business);

  const sectionMap = new Map(business.sections.map((s) => [s.id, { ...s, products: [] as typeof business.products }]));
  const sinSeccion: typeof business.products = [];
  for (const p of business.products) {
    if (p.section && sectionMap.has(p.section.id)) {
      sectionMap.get(p.section.id)!.products.push(p);
    } else {
      sinSeccion.push(p);
    }
  }
  const grupos = [
    ...sectionMap.values().filter((g) => g.products.length > 0),
    ...(sinSeccion.length > 0 ? [{ id: null as null, name: null as null, products: sinSeccion }] : []),
  ];
  const haySecciones = business.sections.length > 0;

  const generalMessage = `¡Hola! Vi tu negocio "${business.name}" en ${SITE_NAME} y quiero hacer un pedido.`;

  return (
    <>
      <ScrollRestorer />
      <PublicHeader />
      <main id="contenido" className="mx-auto w-full max-w-3xl flex-1 pb-28">
        {business.logoUrl ? (
          <div className="relative h-44 w-full overflow-hidden sm:h-56 sm:rounded-b-3xl">
            <Image
              src={business.logoUrl}
              alt={business.name}
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        ) : null}

        <div className="px-4 py-6">
          <nav aria-label="Volver al conjunto">
            <BackLink href={`/${conjunto.slug}`} label={conjunto.name} />
          </nav>

          <header className={`${business.logoUrl ? "mt-4" : "mt-4"} flex items-center gap-3`}>
            {!business.logoUrl && (
              <div
                aria-hidden
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-2xl font-bold text-primary-strong"
              >
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-bold text-neutral-900">{business.name}</h1>
                <StatusBadge isOpen={abiertoAhora} />
              </div>
              {business.categories.length > 0 && (
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                  <Tag aria-hidden className="h-3.5 w-3.5 shrink-0" />
                  {business.categories.map((c) => c.name).join(" · ")}
                </p>
              )}
              {horario && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
                  <Clock aria-hidden className="h-4 w-4 shrink-0" />
                  {horario}
                </p>
              )}
              {business.description && (
                <p className="mt-1 whitespace-pre-line text-sm text-neutral-600">
                  {business.description}
                </p>
              )}
            </div>
          </header>

        {!abiertoAhora && (
          <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm font-medium text-warn-text">
            {business.isOpen && horario
              ? `Este negocio atiende ${horario} — escríbele igual y te responderá en su horario.`
              : "Este negocio está cerrado en este momento. Puedes escribirle igual y te responderá cuando abra."}
          </p>
        )}

        <section className="mt-8">
          {!haySecciones && (
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Productos
            </h2>
          )}
          {business.products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
              <PackageOpen aria-hidden className="mx-auto h-8 w-8 text-neutral-400" />
              <p className="mt-3 text-sm text-neutral-500">
                Este negocio aún no ha publicado productos.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {grupos.map((grupo) => (
                <div key={grupo.id ?? "__sin_seccion__"}>
                  {grupo.name && (
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                      {grupo.name}
                    </h2>
                  )}
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {grupo.products.map((product) => (
                <li
                  key={product.id}
                  className={`flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white ${
                    product.available ? "" : "opacity-60"
                  }`}
                >
                  <Link
                    href={`/${conjunto.slug}/${business.slug}/${product.slug}`}
                    className="flex flex-1 flex-col transition hover:opacity-90"
                  >
                    {product.imageUrls[0] ? (
                      <Image
                        src={product.imageUrls[0]}
                        alt={product.name}
                        width={400}
                        height={400}
                        sizes="(min-width: 640px) 250px, 50vw"
                        className={`aspect-square w-full object-cover ${
                          abiertoAhora ? "" : "grayscale"
                        }`}
                      />
                    ) : (
                      <div
                        aria-hidden
                        className="flex aspect-square w-full items-center justify-center bg-primary-faint text-3xl font-bold text-primary-strong"
                      >
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-3 pb-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">{product.name}</p>
                      {product.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-600">
                          {product.description}
                        </p>
                      )}
                      <div className="mt-auto pt-2">
                        {product.priceType === "COTIZAR" ? (
                          <p className="text-sm font-medium text-neutral-600">Precio a convenir</p>
                        ) : product.priceType === "DESDE" ? (
                          <p className="text-base font-bold text-neutral-900">
                            <span className="font-normal">Desde </span>
                            {formatCOP(product.price)}
                          </p>
                        ) : (
                          <p className="text-base font-bold text-neutral-900">
                            {formatCOP(product.price)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="p-3 pt-0">
                    {product.available ? (
                      product.priceType === "COTIZAR" ? (
                        <a
                          href={waLink(
                            business.whatsappNumber,
                            waProductMessage(product.name, product.priceType, product.price, SITE_NAME)
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Cotizar ${product.name} por WhatsApp`}
                          className="mt-2 flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
                        >
                          <WhatsAppIcon className="h-4 w-4" />
                          Cotizar
                        </a>
                      ) : (
                        <a
                          href={waLink(
                            business.whatsappNumber,
                            waProductMessage(product.name, product.priceType, product.price, SITE_NAME)
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Pedir ${product.name} por WhatsApp`}
                          className="mt-2 flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
                        >
                          <WhatsAppIcon className="h-4 w-4" />
                          Pedir
                        </a>
                      )
                    ) : (
                      <p className="mt-2 min-h-11 content-center rounded-xl bg-neutral-100 px-3 py-2.5 text-center text-sm font-semibold text-neutral-600">
                        Agotado
                      </p>
                    )}
                  </div>
                    </li>
                  ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <a
          href={waLink(business.whatsappNumber, generalMessage)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Escribir a ${business.name} por WhatsApp`}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-white shadow-lg transition hover:bg-primary-strong"
        >
          <WhatsAppIcon className="h-5 w-5" />
          Escribir por WhatsApp
        </a>
        </div>
      </main>
    </>
  );
}
