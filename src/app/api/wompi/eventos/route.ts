import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { revalidateBusinessPages } from "@/lib/revalidate";
import { extendPaidUntil } from "@/lib/subscription";
import { verifyEventChecksum, type WompiEvent } from "@/lib/wompi";
import type { PaymentStatus } from "@/generated/prisma/client";

// Estados finales que reporta Wompi. Cualquier otro (PENDING) se ignora:
// llegará otro evento cuando la transacción se resuelva.
const FINAL_STATUSES: Record<string, PaymentStatus> = {
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
  VOIDED: "VOIDED",
  ERROR: "ERROR",
};

// Máximo de segundos que aceptamos entre el timestamp del evento y ahora.
const MAX_EVENT_AGE_S = 10 * 60; // 10 minutos

/**
 * Webhook de eventos de Wompi: la única fuente de verdad de un pago (la
 * redirección del checkout no valida nada). Responde 200 incluso ante eventos
 * que no aplican, para que Wompi no los reintente eternamente; solo responde
 * error ante firma inválida (401) o fallo nuestro real (500, Wompi reintenta).
 */
export async function POST(request: NextRequest) {
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
  if (!eventsSecret) {
    return NextResponse.json({ error: "Wompi no está configurado" }, { status: 503 });
  }

  let event: WompiEvent;
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!event?.signature?.checksum || !verifyEventChecksum(event, eventsSecret)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  // Rechazar eventos demasiado viejos para prevenir ataques de replay.
  const eventAgeS = (Date.now() / 1000) - (event.timestamp ?? 0);
  if (eventAgeS > MAX_EVENT_AGE_S) {
    console.warn(`Wompi: evento descartado por antigüedad (${Math.round(eventAgeS)}s)`);
    return NextResponse.json({ ok: true });
  }

  if (event.event !== "transaction.updated") {
    console.info(`Wompi: evento ignorado (tipo="${event.event}")`);
    return NextResponse.json({ ok: true });
  }

  const txData = event.data.transaction;
  const reference = typeof txData?.reference === "string" ? txData.reference : "";
  const status = FINAL_STATUSES[String(txData?.status)];
  if (!reference || !status) {
    console.info(`Wompi: evento ignorado (ref="${reference}", status="${txData?.status}")`);
    return NextResponse.json({ ok: true });
  }

  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: {
      business: {
        select: {
          id: true,
          slug: true,
          paidUntil: true,
          conjunto: { select: { slug: true } },
        },
      },
    },
  });
  // Referencia desconocida o pago ya resuelto: el evento es un duplicado o no
  // es nuestro. 200 sin tocar nada (idempotencia).
  if (!payment || payment.method !== "WOMPI" || payment.status !== "PENDING") {
    if (!payment) console.info(`Wompi: referencia desconocida "${reference}"`);
    return NextResponse.json({ ok: true });
  }

  const wompiTransactionId = typeof txData?.id === "string" ? txData.id : null;

  if (status !== "APPROVED") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status, wompiTransactionId },
    });
    return NextResponse.json({ ok: true });
  }

  // El monto viene firmado en el checksum: si no cuadra con lo que se cobró,
  // alguien pagó otra cosa con nuestra referencia. No se acredita.
  if (Number(txData?.amount_in_cents) !== payment.amount * 100) {
    console.error(
      `Wompi: monto del evento (${txData?.amount_in_cents}) no coincide con el pago ${payment.id} (${payment.amount * 100})`
    );
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "ERROR", wompiTransactionId },
    });
    return NextResponse.json({ ok: true });
  }

  const paidUntil = extendPaidUntil(payment.business.paidUntil);
  // La actualización del pago es condicional (where status=PENDING) para que dos
  // entregas concurrentes del mismo evento no puedan acreditar el mes dos veces.
  // Si count === 0, otro proceso ya procesó este evento → nada más que hacer.
  const { count } = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "APPROVED", wompiTransactionId },
    });
    if (result.count === 1) {
      await tx.business.update({
        where: { id: payment.business.id },
        data: { paidUntil },
      });
    }
    return result;
  });

  if (count === 0) {
    console.info(`Wompi: pago ${payment.id} ya fue procesado por otro proceso (idempotencia)`);
  }

  revalidateBusinessPages(payment.business.conjunto.slug, payment.business.slug);
  revalidatePath("/");
  revalidatePath("/dashboard/suscripcion");

  return NextResponse.json({ ok: true });
}
