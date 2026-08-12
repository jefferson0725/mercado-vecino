import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { Search, SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/utils";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { Pagination } from "@/components/Pagination";
import { adminToggleProductModerated } from "../actions";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

function filterHref(disponible?: string, q?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (disponible) params.set("disponible", disponible);
  const query = params.toString();
  return `/admin/productos${query ? `?${query}` : ""}`;
}

export default async function AdminProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; disponible?: string; pagina?: string }>;
}) {
  const { q, disponible, pagina } = await searchParams;

  const busqueda = typeof q === "string" ? q.trim() : "";
  const disponibleActivo = disponible === "1" || disponible === "0" ? disponible : undefined;
  const page = Math.max(1, Number(pagina) || 1);

  const where: Prisma.ProductWhereInput = {
    ...(busqueda && {
      OR: [
        { name: { contains: busqueda, mode: "insensitive" as const } },
        { business: { name: { contains: busqueda, mode: "insensitive" as const } } },
      ],
    }),
    ...(disponibleActivo === "1" && { available: true, moderatedOff: false }),
    ...(disponibleActivo === "0" && { moderatedOff: true }),
  };

  const [productos, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            conjuntoId: true,
            conjunto: { select: { name: true, slug: true } },
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const chipBase =
    "inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition";
  const chipOn = "border-primary bg-primary-soft text-primary-strong";
  const chipOff = "border-neutral-300 bg-white text-neutral-700 hover:border-primary/50";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Productos{" "}
        <span className="font-normal text-neutral-500">· {total} en total</span>
      </h2>

      <Form action="/admin/productos" role="search" className="flex gap-2">
        {disponibleActivo && <input type="hidden" name="disponible" value={disponibleActivo} />}
        <label htmlFor="buscar-producto" className="sr-only">
          Buscar producto por nombre o negocio
        </label>
        <div className="relative w-full">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400"
          />
          <input
            id="buscar-producto"
            type="search"
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar por producto o negocio..."
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

      <nav aria-label="Filtrar productos por disponibilidad" className="flex flex-wrap gap-2">
        <Link
          href={filterHref(undefined, busqueda)}
          aria-current={!disponibleActivo ? "true" : undefined}
          className={`${chipBase} ${!disponibleActivo ? chipOn : chipOff}`}
        >
          Todos
        </Link>
        <Link
          href={filterHref("1", busqueda)}
          aria-current={disponibleActivo === "1" ? "true" : undefined}
          className={`${chipBase} ${disponibleActivo === "1" ? chipOn : chipOff}`}
        >
          Disponibles
        </Link>
        <Link
          href={filterHref("0", busqueda)}
          aria-current={disponibleActivo === "0" ? "true" : undefined}
          className={`${chipBase} ${disponibleActivo === "0" ? chipOn : chipOff}`}
        >
          Moderados
        </Link>
      </nav>

      {productos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <SearchX aria-hidden className="mx-auto h-8 w-8 text-neutral-400" />
          <p className="mt-3 text-sm text-neutral-600">
            {busqueda
              ? `Ningún producto coincide con "${busqueda}".`
              : "No hay productos con este filtro."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {productos.map((product) => (
            <li
              key={product.id}
              className={`flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 ${
                product.moderatedOff ? "opacity-60" : ""
              }`}
            >
              {product.imageUrls[0] ? (
                <Image
                  src={product.imageUrls[0]}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded-xl border border-neutral-100 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs text-neutral-600">
                  Sin foto
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{product.name}</p>
                  {product.moderatedOff && (
                    <span className="shrink-0 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                      Moderado
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-600">
                  {product.priceType === "COTIZAR"
                    ? "A cotizar"
                    : product.priceType === "DESDE"
                    ? `Desde ${formatCOP(product.price)}`
                    : formatCOP(product.price)}
                  {!product.moderatedOff && (
                    <span
                      className={`ml-2 text-xs font-medium ${
                        product.available ? "text-primary" : "text-neutral-600"
                      }`}
                    >
                      {product.available ? "Disponible" : "Agotado"}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  <Link
                    href={`/admin/conjuntos/${product.business.conjuntoId}`}
                    className="hover:underline"
                  >
                    {product.business.name}
                  </Link>{" "}
                  · {product.business.conjunto.name}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5 text-sm">
                {!product.moderatedOff && (
                  <Link
                    href={`/${product.business.conjunto.slug}/${product.business.slug}/${product.slug}`}
                    className="font-medium text-primary hover:underline"
                  >
                    Ver página
                  </Link>
                )}
                <form action={adminToggleProductModerated}>
                  <input type="hidden" name="id" value={product.id} />
                  <ConfirmSubmit
                    message={
                      product.moderatedOff
                        ? `¿Restaurar "${product.name}"? El vendedor podrá verlo y modificarlo de nuevo.`
                        : `¿Moderar "${product.name}"? Desaparecerá de la vitrina y el vendedor no podrá reactivarlo.`
                    }
                    successMessage={product.moderatedOff ? "Producto restaurado" : "Producto moderado"}
                    className={
                      product.moderatedOff
                        ? "text-primary hover:underline"
                        : "text-neutral-600 hover:text-danger"
                    }
                  >
                    {product.moderatedOff ? "Restaurar" : "Moderar"}
                  </ConfirmSubmit>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        basePath="/admin/productos"
        searchParams={{ q: busqueda || undefined, disponible: disponibleActivo }}
      />
    </div>
  );
}
