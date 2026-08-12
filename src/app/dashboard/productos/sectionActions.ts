"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { revalidateBusinessPages } from "@/lib/revalidate";

async function ownedSection(id: string) {
  const { business } = await requireBusiness();
  const section = await prisma.productSection.findUnique({ where: { id } });
  if (!section || section.businessId !== business.id) throw new Error("Sección no encontrada");
  return { business, section };
}

export async function createSection(formData: FormData) {
  const { business } = await requireBusiness();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const last = await prisma.productSection.findFirst({
    where: { businessId: business.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.productSection.create({
    data: { businessId: business.id, name, sortOrder: (last?.sortOrder ?? 0) + 1 },
  });

  revalidatePath("/dashboard/productos");
}

export async function renameSection(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const { business } = await ownedSection(id);
  await prisma.productSection.update({ where: { id }, data: { name } });
  revalidatePath("/dashboard/productos");
  revalidateBusinessPages(business.conjunto.slug, business.slug);
}

export async function deleteSection(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { business } = await ownedSection(id);
  // Los productos quedan sin sección (SetNull por el schema)
  await prisma.productSection.delete({ where: { id } });
  revalidatePath("/dashboard/productos");
  revalidateBusinessPages(business.conjunto.slug, business.slug);
}

export async function moveSectionUp(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { business, section } = await ownedSection(id);

  const prev = await prisma.productSection.findFirst({
    where: { businessId: business.id, sortOrder: { lt: section.sortOrder } },
    orderBy: { sortOrder: "desc" },
  });
  if (!prev) return;

  await prisma.$transaction([
    prisma.productSection.update({ where: { id: section.id }, data: { sortOrder: prev.sortOrder } }),
    prisma.productSection.update({ where: { id: prev.id }, data: { sortOrder: section.sortOrder } }),
  ]);

  revalidatePath("/dashboard/productos");
  revalidateBusinessPages(business.conjunto.slug, business.slug);
}

export async function moveSectionDown(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { business, section } = await ownedSection(id);

  const next = await prisma.productSection.findFirst({
    where: { businessId: business.id, sortOrder: { gt: section.sortOrder } },
    orderBy: { sortOrder: "asc" },
  });
  if (!next) return;

  await prisma.$transaction([
    prisma.productSection.update({ where: { id: section.id }, data: { sortOrder: next.sortOrder } }),
    prisma.productSection.update({ where: { id: next.id }, data: { sortOrder: section.sortOrder } }),
  ]);

  revalidatePath("/dashboard/productos");
  revalidateBusinessPages(business.conjunto.slug, business.slug);
}

export async function assignSection(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "").trim() || null;
  const { business } = await requireBusiness();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.businessId !== business.id) return;

  if (sectionId) {
    const section = await prisma.productSection.findUnique({ where: { id: sectionId } });
    if (!section || section.businessId !== business.id) return;
  }

  await prisma.product.update({ where: { id }, data: { sectionId } });
  revalidatePath("/dashboard/productos");
  revalidateBusinessPages(business.conjunto.slug, business.slug);
}
