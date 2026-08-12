import Image from "next/image";
import Link from "next/link";
import { PackagePlus, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { formatCOP } from "@/lib/utils";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { ImagePreview } from "@/components/ImagePreview";
import { SectionManager } from "./SectionManager";
import { deleteProduct, toggleAvailable } from "./actions";
import { assignSection } from "./sectionActions";

export default async function ProductosPage() {
  const { business } = await requireBusiness();

  const [sections, products] = await Promise.all([
    prisma.productSection.findMany({
      where: { businessId: business.id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { businessId: business.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 500,
    }),
  ]);

  // Agrupar: primero por sección en orden, luego los sin sección
  const sectionMap = new Map(sections.map((s) => [s.id, { ...s, products: [] as typeof products }]));
  const sinSeccion: typeof products = [];

  for (const p of products) {
    if (p.sectionId && sectionMap.has(p.sectionId)) {
      sectionMap.get(p.sectionId)!.products.push(p);
    } else {
      sinSeccion.push(p);
    }
  }

  const grupos: { id: string | null; name: string | null; products: typeof products }[] = [
    ...sectionMap.values(),
    ...(sinSeccion.length > 0
      ? [{ id: null, name: sections.length > 0 ? "Sin sección" : null, products: sinSeccion }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <SectionManager sections={sections} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tus productos ({products.length})</h2>
        <Link
          href="/dashboard/productos/nuevo"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Nuevo
        </Link>
      </div>

      {products.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <PackagePlus aria-hidden className="mx-auto h-8 w-8 text-neutral-400" />
          <p className="mt-3 text-sm text-neutral-500">
            Aún no tienes productos. Crea el primero con el botón "Nuevo".
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Tus productos se publican cuando tu negocio esté aprobado y tu correo verificado.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {grupos.map((grupo) => (
          <div key={grupo.id ?? "__sin_seccion__"}>
            {grupo.name && (
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {grupo.name}
              </h3>
            )}
            <ul className="space-y-3">
              {grupo.products.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3"
                >
                  {product.imageUrls[0] ? (
                    <ImagePreview
                      src={product.imageUrls[0]}
                      alt={product.name}
                      thumbnailClassName="h-16 w-16 shrink-0 rounded-xl border border-neutral-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs text-neutral-600">
                      Sin foto
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="text-sm text-neutral-600">
                      {product.priceType === "COTIZAR"
                        ? "A cotizar"
                        : product.priceType === "DESDE"
                        ? `Desde ${formatCOP(product.price)}`
                        : formatCOP(product.price)}
                    </p>
                    {sections.length > 0 && (
                      <form action={assignSection} className="mt-1">
                        <input type="hidden" name="id" value={product.id} />
                        <select
                          name="sectionId"
                          defaultValue={product.sectionId ?? ""}
                          onChange={(e) => e.currentTarget.form?.requestSubmit()}
                          className="rounded-lg border border-neutral-200 bg-neutral-50 py-0.5 pl-2 pr-6 text-xs text-neutral-600 outline-none focus:border-primary"
                        >
                          <option value="">Sin sección</option>
                          {sections.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </form>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5 text-sm">
                    {product.moderatedOff ? (
                      <span className="text-xs font-semibold text-danger">Moderado</span>
                    ) : (
                      <span className={`text-xs font-medium ${product.available ? "text-primary" : "text-neutral-500"}`}>
                        {product.available ? "Disponible" : "Agotado"}
                      </span>
                    )}
                    <Link
                      href={`/dashboard/productos/${product.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      Editar
                    </Link>
                    {!product.moderatedOff && (
                      <form action={toggleAvailable}>
                        <input type="hidden" name="id" value={product.id} />
                        <button type="submit" className="text-neutral-600 hover:text-neutral-900">
                          {product.available ? "Marcar agotado" : "Marcar disponible"}
                        </button>
                      </form>
                    )}
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={product.id} />
                      <ConfirmSubmit
                        message={`¿Eliminar "${product.name}"?`}
                        className="text-neutral-600 hover:text-danger"
                      >
                        Eliminar
                      </ConfirmSubmit>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
