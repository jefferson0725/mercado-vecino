"use server";

import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsapp, slugify } from "@/lib/utils";
import { createWithUniqueSlug } from "@/lib/unique-slug";
import { LIMITS } from "@/lib/config";

export type RegistroState = { error?: string };

export async function registrarVendedor(
  _prev: RegistroState,
  formData: FormData
): Promise<RegistroState> {
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const businessName = String(formData.get("businessName") ?? "").trim();
  const whatsappRaw = String(formData.get("whatsapp") ?? "");

  if (!inviteCode || !name || !email || !password || !businessName || !whatsappRaw) {
    return { error: "Completa todos los campos." };
  }
  if (name.length > LIMITS.userName) {
    return { error: `Tu nombre no puede superar ${LIMITS.userName} caracteres.` };
  }
  if (businessName.length > LIMITS.businessName) {
    return { error: `El nombre del negocio no puede superar ${LIMITS.businessName} caracteres.` };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const whatsappNumber = normalizeWhatsapp(whatsappRaw);
  if (!whatsappNumber) {
    return { error: "El número de WhatsApp no parece válido. Escribe tu celular de 10 dígitos." };
  }

  const conjunto = await prisma.conjunto.findFirst({
    where: { inviteCode: { equals: inviteCode, mode: "insensitive" }, active: true },
  });
  if (!conjunto) {
    return { error: "El código de invitación no es válido. Pídelo en el grupo de tu conjunto." };
  }

  // Un usuario sin negocio es el rastro de un registro anterior que falló a
  // mitad (la cuenta se creó pero el negocio no): se limpia para que el
  // correo pueda volver a registrarse. Los admin no tienen negocio y no se tocan.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, emailVerified: true, business: { select: { id: true } } },
  });
  if (existing) {
    // Solo se limpia el rastro de un registro fallido: cuenta no verificada y sin negocio.
    // Si la cuenta está verificada significa que es real → no tocar, dejar que signUpEmail
    // devuelva UNPROCESSABLE_ENTITY y lo capturemos como "ya existe una cuenta".
    if (!existing.business && existing.role !== "ADMIN" && !existing.emailVerified) {
      await prisma.user.delete({ where: { id: existing.id } });
    }
  }

  try {
    await auth.api.signUpEmail({ body: { email, password, name } });
  } catch (e) {
    if (e instanceof APIError) {
      return {
        error:
          e.status === "UNPROCESSABLE_ENTITY"
            ? "Ya existe una cuenta con ese correo."
            : "No se pudo crear la cuenta. Intenta de nuevo.",
      };
    }
    throw e;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { email } });

  try {
    await createWithUniqueSlug(slugify(businessName) || "negocio", (slug) =>
      prisma.business.create({
        data: {
          conjuntoId: conjunto.id,
          ownerId: user.id,
          name: businessName,
          slug,
          whatsappNumber,
        },
      })
    );
  } catch (e) {
    // Compensación: sin negocio la cuenta queda inservible y bloquearía el
    // correo. Se borra (el cascade limpia sesión y credenciales) para que el
    // vendedor pueda reintentar desde cero.
    console.error("Registro: falló la creación del negocio", e);
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    return { error: "No se pudo crear el negocio. Intenta de nuevo." };
  }

  redirect("/dashboard?bienvenida=1");
}
