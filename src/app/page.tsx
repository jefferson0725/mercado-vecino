import Link from "next/link";
import Image from "next/image";
import { Building2, ChevronRight, MapPin, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/config";
import { publicBusinessWhere } from "@/lib/subscription";
import { PublicHeader } from "@/components/PublicHeader";

export const revalidate = 30;

export default async function HomePage() {
  const conjuntos = await prisma.conjunto.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    take: 100,
    include: {
      _count: { select: { businesses: { where: publicBusinessWhere() } } },
    },
  });

  return (
    <>
      <PublicHeader />
      <main id="contenido" className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-primary-faint via-primary-faint/40 to-transparent px-4 py-14 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-primary-soft/60 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -bottom-20 h-56 w-56 rounded-full bg-primary-soft/50 blur-3xl"
          />
          <p className="relative inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/80 px-3 py-1 text-xs font-semibold text-primary-strong">
            <MapPin aria-hidden className="h-3.5 w-3.5" />
            Los negocios de tu conjunto residencial
          </p>
          <h1 className="relative mt-4 font-display text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            {SITE_NAME}
          </h1>
          <p className="relative mx-auto mt-3 max-w-md text-neutral-600">{SITE_DESCRIPTION}</p>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Conjuntos
          </h2>
          {conjuntos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
              <Building2 aria-hidden className="mx-auto h-8 w-8 text-neutral-400" />
              <p className="mt-3 text-sm text-neutral-500">Aún no hay conjuntos registrados.</p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {conjuntos.map((conjunto, index) => (
                <li key={conjunto.id}>
                  <Link
                    href={`/${conjunto.slug}`}
                    className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-primary/50 hover:shadow-sm"
                  >
                    {conjunto.imageUrl && (
                      <div className="relative h-36 w-full overflow-hidden">
                        <Image
                          src={conjunto.imageUrl}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 50vw, 100vw"
                          className="object-cover transition duration-300 group-hover:scale-105"
                          priority={index === 0}
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3 p-4">
                      {!conjunto.imageUrl && (
                        <span
                          aria-hidden
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-faint text-primary-strong transition group-hover:bg-primary-soft"
                        >
                          <Building2 className="h-5 w-5" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-neutral-900">
                          {conjunto.name}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-500">
                          <Store aria-hidden className="h-3.5 w-3.5" />
                          {conjunto._count.businesses}{" "}
                          {conjunto._count.businesses === 1 ? "negocio" : "negocios"}
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden
                        className="h-5 w-5 shrink-0 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-primary"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="relative mt-12 overflow-hidden rounded-2xl bg-primary p-6 text-center text-white">
          <Store
            aria-hidden
            className="pointer-events-none absolute -right-6 -bottom-8 h-36 w-36 text-white/10"
          />
          <h2 className="font-display text-xl font-bold">¿Vendes algo en tu conjunto?</h2>
          <p className="mt-1 text-sm text-primary-faint">
            Crea tu página con el código de invitación de tu conjunto y recibe pedidos por
            WhatsApp.
          </p>
          <Link
            href="/registro"
            className="relative mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-semibold text-primary-strong transition hover:bg-primary-faint"
          >
            <Store aria-hidden className="h-4 w-4" />
            Crear mi negocio
          </Link>
        </section>
      </main>
    </>
  );
}
