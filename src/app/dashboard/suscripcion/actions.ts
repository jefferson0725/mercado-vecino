"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { checkoutUrl, wompiEnabled } from "@/lib/wompi";

// Ventana en la que una sesión de checkout de Wompi se considera activa.
// Dentro de este plazo reutilizamos la referencia existente; pasado el plazo
// anulamos el PENDING viejo y creamos uno nuevo.
const CHECKOUT_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Redirige al vendedor al checkout de Wompi. El pago se acredita cuando el
 * webhook /api/wompi/eventos confirme la transacción.
 *
 * Deduplicación: si ya hay un PENDING reciente (< 2h) reutilizamos su
 * referencia — el vendedor vuelve al mismo checkout sin crear registros
 * duplicados. Si el PENDING es más antiguo (sesión de Wompi expirada),
 * lo anulamos y abrimos uno nuevo.
 */
export async function payWithWompi() {
  const { business } = await requireBusiness();
  const price = business.conjunto.monthlyPrice;
  if (!wompiEnabled() || price <= 0) redirect("/dashboard/suscripcion");

  const cutoff = new Date(Date.now() - CHECKOUT_WINDOW_MS);

  // Buscar PENDING reciente con el mismo precio (el precio puede cambiar)
  const recentPending = await prisma.payment.findFirst({
    where: {
      businessId: business.id,
      method: "WOMPI",
      status: "PENDING",
      amount: price,
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: "desc" },
    select: { reference: true },
  });

  let reference: string;

  if (recentPending) {
    // Reutilizar la sesión activa sin tocar la BD
    reference = recentPending.reference;
  } else {
    // Anular PENDINGs viejos (sesión de Wompi ya expirada) antes de crear uno nuevo
    await prisma.payment.updateMany({
      where: {
        businessId: business.id,
        method: "WOMPI",
        status: "PENDING",
      },
      data: { status: "VOIDED" },
    });

    reference = `sub_${business.id}_${Date.now()}`;
    await prisma.payment.create({
      data: {
        businessId: business.id,
        amount: price,
        method: "WOMPI",
        reference,
      },
    });
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  redirect(checkoutUrl(reference, price * 100, `${base}/dashboard/suscripcion`));
}
