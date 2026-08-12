"use server";

import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { revalidateBusinessPages } from "@/lib/revalidate";
import { slugify, isValidImageUrl } from "@/lib/utils";
import { createWithUniqueSlug } from "@/lib/unique-slug";
import { LIMITS } from "@/lib/config";
import type { PriceType } from "@/generated/prisma/client";

export type ProductFormState = { error?: string; success?: boolean };

const VALID_PRICE_TYPES = ["FIJO", "DESDE", "COTIZAR"] as const;

function isPriceType(v: string): v is PriceType {
  return (VALID_PRICE_TYPES as readonly string[]).includes(v);
}

async function ownedProduct(id: string) {
  const { business } = await requireBusiness();
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.businessId !== business.id) {
    throw new Error("Producto no encontrado");
  }
  return { business, product };
}

export async function saveProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const { business } = await requireBusiness();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").replace(/[.,\s]/g, "");
  const available = formData.get("available") === "on";
  const priceTypeRaw = String(formData.get("priceType") ?? "FIJO").trim();

  if (!name) return { error: "El nombre del producto es obligatorio." };
  if (name.length > LIMITS.productName) {
    return { error: `El nombre no puede superar ${LIMITS.productName} caracteres.` };
  }
  if (description.length > LIMITS.description) {
    return { error: `La descripción no puede superar ${LIMITS.description} caracteres.` };
  }

  const imageUrls = [0, 1, 2]
    .map((i) => String(formData.get(`imageUrl_${i}`) ?? "").trim())
    .filter((url) => url !== "");

  for (const url of imageUrls) {
    if (!isValidImageUrl(url)) {
      return { error: "Una de las imágenes no es válida. Súbela desde el formulario." };
    }
  }

  if (!isPriceType(priceTypeRaw)) {
    return { error: "Tipo de precio inválido." };
  }
  const priceType: PriceType = priceTypeRaw;

  let price: number;
  if (priceType === "COTIZAR") {
    price = 0;
  } else {
    const parsed = Number(priceRaw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return { error: "Escribe un precio válido en pesos, sin decimales." };
    }
    if (parsed > LIMITS.priceMax) {
      return { error: "El precio es demasiado alto. Revisa que no tenga ceros de más." };
    }
    price = parsed;
  }

  const sectionIdRaw = String(formData.get("sectionId") ?? "").trim();
  const sectionId = sectionIdRaw || null;

  // Verificar que la sección pertenece al negocio
  if (sectionId) {
    const section = await prisma.productSection.findUnique({ where: { id: sectionId } });
    if (!section || section.businessId !== business.id) {
      return { error: "Sección inválida." };
    }
  }

  const data = { name, description, price, priceType, imageUrls, available, sectionId };

  if (id) {
    // El slug no cambia al editar: las URLs compartidas por WhatsApp siguen vivas
    const { product } = await ownedProduct(id);
    await prisma.product.update({ where: { id: product.id }, data });
  } else {
    const count = await prisma.product.count({ where: { businessId: business.id } });
    await createWithUniqueSlug(slugify(name) || "producto", (slug) =>
      prisma.product.create({
        data: { ...data, slug, businessId: business.id, sortOrder: count + 1 },
      })
    );
  }

  revalidateBusinessPages(business.conjunto.slug, business.slug);
  return { success: true };
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { business, product } = await ownedProduct(id);
  await prisma.product.delete({ where: { id: product.id } });
  revalidateBusinessPages(business.conjunto.slug, business.slug);
}

export async function toggleAvailable(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { business, product } = await ownedProduct(id);
  // Un producto moderado por el admin no puede ser reactivado por el vendedor
  if (product.moderatedOff) return;
  await prisma.product.update({
    where: { id: product.id },
    data: { available: !product.available },
  });
  revalidateBusinessPages(business.conjunto.slug, business.slug);
}
