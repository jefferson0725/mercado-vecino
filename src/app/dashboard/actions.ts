"use server";

import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { normalizeWhatsapp, isValidImageUrl } from "@/lib/utils";
import { LIMITS } from "@/lib/config";
import { revalidateBusinessPages } from "@/lib/revalidate";
import { TIME_REGEX, isWeekday } from "@/lib/schedule";

export async function toggleOpen() {
  const { business } = await requireBusiness();
  await prisma.business.update({
    where: { id: business.id },
    data: { isOpen: !business.isOpen },
  });
  revalidateBusinessPages(business.conjunto.slug, business.slug);
}

export type BusinessFormState = { error?: string; success?: boolean };

export async function updateBusiness(
  _prev: BusinessFormState,
  formData: FormData
): Promise<BusinessFormState> {
  const { business } = await requireBusiness();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const whatsappRaw = String(formData.get("whatsapp") ?? "");
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();

  if (!name) return { error: "El nombre del negocio es obligatorio." };
  if (name.length > LIMITS.businessName) {
    return { error: `El nombre no puede superar ${LIMITS.businessName} caracteres.` };
  }
  if (description.length > LIMITS.description) {
    return { error: `La descripción no puede superar ${LIMITS.description} caracteres.` };
  }

  if (!isValidImageUrl(logoUrl)) {
    return { error: "La imagen del logo no es válida. Súbela desde el formulario." };
  }

  const whatsappNumber = normalizeWhatsapp(whatsappRaw);
  if (!whatsappNumber) {
    return { error: "El número de WhatsApp no parece válido. Escribe tu celular de 10 dígitos." };
  }

  const categoryIds = formData.getAll("categories").map(String).filter(Boolean);

  // Validate that submitted ids actually exist in the DB
  const validCategories = categoryIds.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true },
      })
    : [];
  const validIds = validCategories.map((c) => c.id);

  const opensAt = String(formData.get("opensAt") ?? "").trim();
  const closesAt = String(formData.get("closesAt") ?? "").trim();
  if ((opensAt === "") !== (closesAt === "")) {
    return { error: "Para fijar horario completa la hora de apertura y la de cierre." };
  }
  if (opensAt && (!TIME_REGEX.test(opensAt) || !TIME_REGEX.test(closesAt))) {
    return { error: "El horario no es válido." };
  }
  if (opensAt && opensAt === closesAt) {
    return { error: "La hora de apertura y de cierre no pueden ser iguales." };
  }

  const openDays = formData.getAll("openDays").map(String).filter(isWeekday);
  if (openDays.length === 7) openDays.length = 0; // todos los días = sin restricción

  await prisma.business.update({
    where: { id: business.id },
    data: {
      name,
      description,
      whatsappNumber,
      logoUrl: logoUrl || null,
      categories: { set: validIds.map((id) => ({ id })) },
      opensAt: opensAt || null,
      closesAt: closesAt || null,
      openDays,
    },
  });
  revalidateBusinessPages(business.conjunto.slug, business.slug);
  return { success: true };
}
