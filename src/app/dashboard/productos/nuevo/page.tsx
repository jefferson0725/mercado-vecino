import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { ProductForm } from "../ProductForm";

export default async function NuevoProductoPage() {
  const { business } = await requireBusiness();
  const sections = await prisma.productSection.findMany({
    where: { businessId: business.id },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Nuevo producto</h2>
      <ProductForm sections={sections} />
    </div>
  );
}
