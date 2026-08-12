import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SITE_NAME } from "@/lib/config";
import { formatCOP, waLink, waProductMessage } from "@/lib/utils";
import { isOpenNow, describeSchedule } from "@/lib/schedule";
import { publicBusinessWhere } from "@/lib/subscription";
import { PublicHeader } from "@/components/PublicHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { BackLink } from "@/components/BackLink";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { ProductGallery } from "@/components/ProductGallery";

// El badge abierto/cerrado depende de la hora: regenerar como máximo cada minuto
export const revalidate = 60;

async function getProduct(conjuntoSlug: string, negocioSlug: string, productoSlug: string) {
  const conjunto = await prisma.conjunto.findFirst({
    where: { slug: conjuntoSlug, active: true },
    select: { id: true, name: true, slug: true },
  });
  if (!conjunto) return null;
  const business = await prisma.business.findFirst({
    where: { conjuntoId: conjunto.id, slug: negocioSlug, ...publicBusinessWhere() },
  });
  if (!business) return null;
  const product = await prisma.product.findUnique({
    where: { businessId_slug: { businessId: business.id, slug: productoSlug } },
  });
  if (!product || product.moderatedOff) return null;
  return { conjunto, business, product };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ conjunto: string; negocio: string; producto: string }>;
}): Promise<Metadata> {
  const { conjunto, negocio, producto } = await params;
  const data = await getProduct(conjunto, negocio, producto);
  if (!data) return {};
  const description =
    data.product.description || `Pide ${data.product.name} por WhatsApp en ${data.business.name}.`;
  return {
    title: `${data.product.name} · ${data.business.name}`,
    description,
    openGraph: {
      title: data.product.name,
      description,
      images: data.product.imageUrls.length > 0 ? [data.product.imageUrls[0]] : undefined,
    },
  };
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ conjunto: string; negocio: string; producto: string }>;
}) {
  const { conjunto: conjuntoSlug, negocio: negocioSlug, producto: productoSlug } = await params;
  const data = await getProduct(conjuntoSlug, negocioSlug, productoSlug);
  if (!data) notFound();
  const { conjunto, business, product } = data;
  const abiertoAhora = isOpenNow(business);
  const horario = describeSchedule(business);

  const waMessage = waProductMessage(product.name, product.priceType, product.price, SITE_NAME);

  return (
    <>
      <PublicHeader />
      <main id="contenido" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <nav aria-label="Volver al negocio">
          <BackLink href={`/${conjunto.slug}/${business.slug}`} label={business.name} />
        </nav>

        {product.imageUrls.length > 0 ? (
          <ProductGallery
            images={product.imageUrls}
            name={product.name}
            grayscale={!abiertoAhora}
          />
        ) : (
          <div
            aria-hidden
            className="mt-4 flex aspect-square w-full items-center justify-center rounded-2xl bg-primary-faint text-6xl font-bold text-primary-strong"
          >
            {product.name.charAt(0).toUpperCase()}
          </div>
        )}

        <header className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-neutral-900">{product.name}</h1>
            {!product.available && (
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600">
                Agotado
              </span>
            )}
          </div>
          <div className="mt-2">
            {product.priceType === "COTIZAR" ? (
              <p className="text-lg font-medium text-neutral-600">Precio a convenir</p>
            ) : product.priceType === "DESDE" ? (
              <p className="text-2xl font-bold text-neutral-900">
                <span className="text-base font-normal">Desde </span>
                {formatCOP(product.price)}
              </p>
            ) : (
              <p className="text-2xl font-bold text-neutral-900">{formatCOP(product.price)}</p>
            )}
          </div>
        </header>

        {product.description && (
          <p className="mt-4 whitespace-pre-line text-neutral-700">{product.description}</p>
        )}

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-faint text-primary-strong"
          >
            <Store className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 text-sm text-neutral-600">
            Vendido por{" "}
            <Link
              href={`/${conjunto.slug}/${business.slug}`}
              className="font-semibold text-primary hover:underline"
            >
              {business.name}
            </Link>
          </span>
          <StatusBadge isOpen={abiertoAhora} />
        </div>

        {!abiertoAhora && (
          <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm font-medium text-warn-text">
            {business.isOpen && horario
              ? `Este negocio atiende ${horario} — escríbele igual y te responderá en su horario.`
              : "Este negocio está cerrado en este momento. Puedes escribirle igual y te responderá cuando abra."}
          </p>
        )}

        {product.available ? (
          <a
            href={waLink(business.whatsappNumber, waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${product.priceType === "COTIZAR" ? "Cotizar" : "Pedir"} ${product.name} por WhatsApp`}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary-strong"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {product.priceType === "COTIZAR" ? "Cotizar por WhatsApp" : "Pedir por WhatsApp"}
          </a>
        ) : (
          <p className="mt-6 min-h-12 w-full content-center rounded-xl bg-neutral-100 px-4 py-3 text-center font-semibold text-neutral-600">
            Agotado por ahora
          </p>
        )}
      </main>
    </>
  );
}
