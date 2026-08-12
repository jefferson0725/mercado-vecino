import { prisma } from "@/lib/prisma";
import { createCategory, deleteCategory } from "../actions";
import { CategoryForm } from "./CategoryForm";
import { RenameForm } from "./RenameForm";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { businesses: true } } },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Nueva categoría</h2>
        <CategoryForm action={createCategory} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Categorías ({categories.length})</h2>
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-2xl border border-neutral-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-neutral-900">{cat.name}</p>
                <p className="text-xs text-neutral-500">
                  slug: {cat.slug} · {cat._count.businesses}{" "}
                  {cat._count.businesses === 1 ? "negocio" : "negocios"}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <RenameForm id={cat.id} currentName={cat.name} />

              {cat._count.businesses > 0 ? (
                <span className="text-sm text-neutral-400" title="Esta categoría está en uso">
                  En uso — no se puede eliminar
                </span>
              ) : (
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={cat.id} />
                  <ConfirmSubmit
                    message={`¿Eliminar la categoría "${cat.name}"? Esta acción no se puede deshacer.`}
                    className="text-sm text-danger hover:underline"
                  >
                    Eliminar
                  </ConfirmSubmit>
                </form>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
