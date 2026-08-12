import type { Prisma } from "@/generated/prisma/client";
import { SUBSCRIPTION } from "./config";

const DAY_MS = 24 * 60 * 60 * 1000;

export type SubscriptionStatus = "exenta" | "activa" | "gracia" | "vencida";

/** Suma un mes calendario con tope de fin de mes (31 ene → 28/29 feb). */
export function addOneMonth(date: Date): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + 1);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

/**
 * Nueva vigencia al registrar un pago: un mes contado desde el vencimiento
 * actual si aún no llega (pagar por adelantado acumula) o desde hoy si ya
 * venció (la mora no se cobra retroactiva).
 */
export function extendPaidUntil(current: Date | null, now = new Date()): Date {
  const base = current && current > now ? current : now;
  return addOneMonth(base);
}

/** Último instante en que el negocio sigue visible tras vencer. */
export function graceEndsAt(paidUntil: Date): Date {
  return new Date(paidUntil.getTime() + SUBSCRIPTION.graceDays * DAY_MS);
}

// Con cuántos días de antelación se le avisa al vendedor que se acerca el pago
export const WARN_DAYS = 5;

/** La vigencia expira dentro de los próximos días de aviso. */
export function expiresSoon(paidUntil: Date, now = new Date()): boolean {
  return paidUntil.getTime() - now.getTime() <= WARN_DAYS * DAY_MS;
}

export function subscriptionStatus(
  paidUntil: Date | null,
  monthlyPrice: number,
  now = new Date()
): SubscriptionStatus {
  if (monthlyPrice <= 0) return "exenta";
  if (!paidUntil) return "vencida";
  if (paidUntil > now) return "activa";
  if (graceEndsAt(paidUntil) > now) return "gracia";
  return "vencida";
}

/**
 * Filtro compartido por todas las vistas públicas: negocio aprobado, activo,
 * con el correo del dueño verificado y con suscripción vigente (o en gracia, o
 * de un conjunto exento). El estado se evalúa contra el reloj en cada render —
 * no hay jobs que muten la BD.
 */
export function publicBusinessWhere(now = new Date()) {
  return {
    active: true,
    approved: true,
    // El negocio no es visible hasta que el vendedor verifique su correo.
    owner: { emailVerified: true },
    OR: [
      { conjunto: { monthlyPrice: { lte: 0 } } },
      { paidUntil: { gt: new Date(now.getTime() - SUBSCRIPTION.graceDays * DAY_MS) } },
    ],
  } satisfies Prisma.BusinessWhereInput;
}
