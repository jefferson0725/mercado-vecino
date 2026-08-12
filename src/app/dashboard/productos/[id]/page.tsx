import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { ProductForm } from "../ProductForm";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { business } = await requireBusiness();

  const [product, sections] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.productSection.findMany({
      where: { businessId: business.id },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!product || product.businessId !== business.id) redirect("/dashboard/productos");

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Editar producto</h2>
      <ProductForm
        sections={sections}
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          priceType: product.priceType,
          imageUrls: product.imageUrls,
          available: product.available,
          sectionId: product.sectionId,
        }}
      />
    </div>
  );
}
