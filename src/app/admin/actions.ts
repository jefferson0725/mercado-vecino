"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/utils";
import { LIMITS, SUBSCRIPTION } from "@/lib/config";
import { extendPaidUntil } from "@/lib/subscription";
import { revalidateBusinessPages } from "@/lib/revalidate";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Precio mensual del formulario: entero en COP entre 0 (exento) y el tope. */
function parseMonthlyPrice(formData: FormData): number | null {
  const raw = String(formData.get("monthlyPrice") ?? "0").trim();
  // Solo dígitos (sin notación científica, espacios ni signos)
  if (raw !== "" && !/^\d+$/.test(raw)) return null;
  const price = raw === "" ? 0 : Number(raw);
  if (!Number.isInteger(price) || price < 0 || price > LIMITS.priceMax) return null;
  return price;
}

export type AdminFormState = { error?: string; success?: boolean };

// Alfabeto sin caracteres confusos (0/O, 1/I/L)
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(length: number) {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

async function generateInviteCode(name: string) {
  const prefix = (slugify(name).split("-")[0] || "conjunto").toUpperCase().slice(0, 10);
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `${prefix}-${randomCode(4)}`;
    const exists = await prisma.conjunto.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  return `${prefix}-${randomCode(8)}`;
}

export async function createConjunto(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Escribe el nombre del conjunto." };

  const slug = slugify(name);
  if (!slug) return { error: "El nombre debe tener letras o números." };

  const monthlyPrice = parseMonthlyPrice(formData);
  if (monthlyPrice === null) return { error: "El precio mensual no es válido." };

  const exists = await prisma.conjunto.findUnique({ where: { slug }, select: { id: true } });
  if (exists) return { error: "Ya existe un conjunto con ese nombre." };

  const inviteCode = await generateInviteCode(name);
  await prisma.conjunto.create({ data: { name, slug, inviteCode, monthlyPrice } });

  revalidatePath("/admin");
  revalidatePath("/admin/conjuntos");
  revalidatePath("/");
  return { success: true };
}

export async function updateConjuntoImage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  let conjunto;
  try {
    conjunto = await prisma.conjunto.update({ where: { id }, data: { imageUrl } });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2025") return;
    throw e;
  }
  revalidatePath("/admin/conjuntos");
  revalidatePath("/");
  revalidatePath(`/${conjunto.slug}`);
}

export async function regenerateInviteCode(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const conjunto = await prisma.conjunto.findUniqueOrThrow({ where: { id } });
  await prisma.conjunto.update({
    where: { id },
    data: { inviteCode: await generateInviteCode(conjunto.name) },
  });
  revalidatePath("/admin/conjuntos");
}

export async function updateConjuntoPrice(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const monthlyPrice = parseMonthlyPrice(formData);
  if (monthlyPrice === null) return;

  let conjunto;
  try {
    conjunto = await prisma.conjunto.update({ where: { id }, data: { monthlyPrice } });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2025") return;
    throw e;
  }

  // El precio cambia la visibilidad (exento ↔ de pago): refrescar el catálogo
  revalidatePath("/admin/conjuntos");
  revalidatePath("/");
  revalidatePath(`/${conjunto.slug}`, "layout");
}

export async function updateConjuntoTransfer(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const method = String(formData.get("transferMethod") ?? "").trim();
  const account = String(formData.get("transferAccount") ?? "").trim();
  const holder = String(formData.get("transferHolder") ?? "").trim();
  const key = String(formData.get("transferKey") ?? "").trim();
  const whatsapp = String(formData.get("transferWhatsapp") ?? "").trim();

  if (!method || !account || !holder) return { error: "Completa los tres campos obligatorios." };

  await prisma.conjunto.update({
    where: { id },
    data: {
      transferMethod: method,
      transferAccount: account,
      transferHolder: holder,
      transferKey: key || null,
      transferWhatsapp: whatsapp || null,
    },
  });

  revalidatePath(`/admin/conjuntos/${id}`);
  revalidatePath("/dashboard/suscripcion");
  return { success: true };
}

export async function toggleConjuntoActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const conjunto = await prisma.conjunto.findUniqueOrThrow({ where: { id } });
  await prisma.conjunto.update({ where: { id }, data: { active: !conjunto.active } });
  revalidatePath("/admin");
  revalidatePath("/admin/conjuntos");
  revalidatePath("/");
  revalidatePath(`/${conjunto.slug}`);
}

export async function approveBusiness(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const business = await prisma.business.findUniqueOrThrow({
    where: { id },
    include: { conjunto: { select: { slug: true } } },
  });
  if (business.approved) return;
  await prisma.business.update({
    where: { id },
    // La suscripción arranca con los días de prueba gratis
    data: { approved: true, paidUntil: new Date(Date.now() + SUBSCRIPTION.trialDays * DAY_MS) },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/conjuntos/${business.conjuntoId}`);
  revalidatePath("/");
  revalidatePath(`/${business.conjunto.slug}`);
  revalidatePath(`/${business.conjunto.slug}/${business.slug}`);
}

/**
 * Rechazar un registro pendiente elimina la cuenta completa (el cascade borra
 * negocio, productos, sesiones y credenciales). Así el correo queda libre si
 * la persona vuelve a registrarse con un código legítimo. Solo aplica a
 * negocios sin aprobar: para los aprobados está toggleBusinessActive.
 */
export async function rejectBusiness(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const business = await prisma.business.findUnique({
    where: { id },
    select: { ownerId: true, conjuntoId: true, approved: true },
  });
  if (!business || business.approved) return;
  await prisma.user.delete({ where: { id: business.ownerId } });
  revalidatePath("/admin");
  revalidatePath(`/admin/conjuntos/${business.conjuntoId}`);
  revalidatePath("/admin/usuarios");
}

export async function toggleBusinessActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const business = await prisma.business.findUniqueOrThrow({
    where: { id },
    include: { conjunto: { select: { slug: true } } },
  });
  await prisma.business.update({ where: { id }, data: { active: !business.active } });
  revalidatePath("/admin");
  revalidatePath(`/admin/conjuntos/${business.conjuntoId}`);
  revalidatePath(`/${business.conjunto.slug}`);
  revalidatePath(`/${business.conjunto.slug}/${business.slug}`);
}

/**
 * El admin recibió la plata por fuera (transferencia, efectivo) y la registra aquí:
 * queda un Payment MANUAL aprobado y la vigencia suma un mes, igual que un
 * pago por Wompi.
 */
export async function registerManualPayment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const business = await prisma.business.findUniqueOrThrow({
    where: { id },
    include: { conjunto: { select: { slug: true, monthlyPrice: true } } },
  });
  // Sin aprobar no hay suscripción que extender; exento no cobra
  if (!business.approved || business.conjunto.monthlyPrice <= 0) return;

  // Calculamos paidUntil dentro de la transacción leyendo el valor fresco,
  // evitando la race en la que dos admins extienden desde el mismo paidUntil base.
  await prisma.$transaction(async (tx) => {
    const fresh = await tx.business.findUniqueOrThrow({
      where: { id },
      select: { paidUntil: true },
    });
    const paidUntil = extendPaidUntil(fresh.paidUntil);
    await tx.payment.create({
      data: {
        businessId: business.id,
        amount: business.conjunto.monthlyPrice,
        method: "MANUAL",
        status: "APPROVED",
        reference: `manual_${business.id}_${Date.now()}`,
        note: "Registrado por el administrador",
      },
    });
    await tx.business.update({ where: { id }, data: { paidUntil } });
  });

  revalidateBusinessPages(business.conjunto.slug, business.slug);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/conjuntos/${business.conjuntoId}`);
  revalidatePath("/dashboard/suscripcion");
}

export async function setUserRole(formData: FormData) {
  const session = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (role !== "ADMIN" && role !== "SELLER") return;

  // La UI oculta el botón en tu propia fila; esto es el guard server-side.
  if (!userId || userId === session.user.id) return;

  // Garantizar que siempre quede al menos un admin en el sistema.
  if (role === "SELLER") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) return; // rechazar silenciosamente
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
}

/**
 * El admin puede moderar un producto ocultándolo de la vitrina pública sin
 * eliminarlo. Mientras `moderatedOff` sea true el vendedor no puede
 * reactivarlo; para desbloquearlo el admin debe usar esta misma acción.
 */
export async function adminToggleProductModerated(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const product = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: {
      business: { select: { slug: true, conjunto: { select: { slug: true } } } },
    },
  });
  await prisma.product.update({ where: { id }, data: { moderatedOff: !product.moderatedOff } });

  const conjuntoSlug = product.business.conjunto.slug;
  revalidatePath("/admin/productos");
  revalidatePath("/admin");
  revalidatePath(`/${conjuntoSlug}`);
  revalidatePath(`/${conjuntoSlug}/${product.business.slug}`);
  revalidatePath(`/${conjuntoSlug}/${product.business.slug}/${product.slug}`);
}

export async function createCategory(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Escribe el nombre de la categoría." };

  const slug = slugify(name);
  if (!slug) return { error: "El nombre debe tener letras o números." };

  const exists = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (exists) return { error: "Ya existe una categoría con ese slug." };

  await prisma.category.create({ data: { id: slug, name, slug } });

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function renameCategory(
  _prev: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { error: "ID de categoría inválido." };
  if (!name) return { error: "Escribe el nuevo nombre." };

  await prisma.category.update({ where: { id }, data: { name } });

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  // Server-side guard: do not delete if any business uses this category
  const cat = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { businesses: true } } },
  });
  if (!cat) return;
  if (cat._count.businesses > 0) return; // silently refuse — UI already prevents it

  await prisma.category.delete({ where: { id } });

  revalidatePath("/admin/categorias");
  revalidatePath("/", "layout");
}
