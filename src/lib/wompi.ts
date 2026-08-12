import { createHash } from "crypto";

/**
 * Integración con el Web Checkout de Wompi (pasarela de Bancolombia).
 *
 * Modelo prepago: el vendedor paga un mes cuando quiere, no guardamos medios
 * de pago ni hay cobros recurrentes. El checkout ocurre en wompi.co (la app
 * nunca ve datos de tarjeta) y el resultado llega firmado al webhook
 * /api/wompi/eventos, que es la única fuente de verdad del pago.
 *
 * Si las llaves no están configuradas la función wompiEnabled() apaga toda la
 * UI de Wompi y queda solo el pago manual: así se puede operar mientras
 * aprueban la cuenta de comercio.
 */

const CHECKOUT_BASE = "https://checkout.wompi.co/p/";
const CURRENCY = "COP";

export function wompiEnabled(): boolean {
  return Boolean(
    process.env.WOMPI_PUBLIC_KEY &&
      process.env.WOMPI_INTEGRITY_SECRET &&
      process.env.WOMPI_EVENTS_SECRET
  );
}

/** Firma de integridad del checkout: evita que alteren monto o referencia. */
export function integritySignature(
  reference: string,
  amountInCents: number,
  integritySecret: string
): string {
  return createHash("sha256")
    .update(`${reference}${amountInCents}${CURRENCY}${integritySecret}`)
    .digest("hex");
}

export function buildCheckoutUrl(params: {
  publicKey: string;
  reference: string;
  amountInCents: number;
  integritySecret: string;
  redirectUrl: string;
}): string {
  const url = new URL(CHECKOUT_BASE);
  url.searchParams.set("public-key", params.publicKey);
  url.searchParams.set("currency", CURRENCY);
  url.searchParams.set("amount-in-cents", String(params.amountInCents));
  url.searchParams.set("reference", params.reference);
  url.searchParams.set(
    "signature:integrity",
    integritySignature(params.reference, params.amountInCents, params.integritySecret)
  );
  url.searchParams.set("redirect-url", params.redirectUrl);
  return url.toString();
}

/** URL de checkout leyendo llaves del entorno. Lanza si Wompi no está configurado. */
export function checkoutUrl(reference: string, amountInCents: number, redirectUrl: string) {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!publicKey || !integritySecret) {
    throw new Error("Wompi no está configurado (WOMPI_PUBLIC_KEY / WOMPI_INTEGRITY_SECRET).");
  }
  return buildCheckoutUrl({ publicKey, reference, amountInCents, integritySecret, redirectUrl });
}

// Forma del evento que envía Wompi al webhook (solo lo que usamos)
export type WompiEvent = {
  event: string;
  data: { transaction?: Record<string, unknown> };
  timestamp: number;
  signature: { properties: string[]; checksum: string };
};

/** Resuelve "transaction.amount_in_cents" dentro de event.data */
function propertyValue(data: WompiEvent["data"], path: string): string {
  let value: unknown = data;
  for (const key of path.split(".")) {
    if (value === null || typeof value !== "object") return "";
    value = (value as Record<string, unknown>)[key];
  }
  return value === undefined || value === null ? "" : String(value);
}

/**
 * Checksum de eventos según la spec de Wompi: SHA256 de la concatenación de
 * las propiedades listadas en signature.properties (en ese orden), el
 * timestamp y el secreto de eventos.
 */
export function eventChecksum(event: WompiEvent, eventsSecret: string): string {
  const concatenated = event.signature.properties
    .map((path) => propertyValue(event.data, path))
    .join("");
  return createHash("sha256")
    .update(`${concatenated}${event.timestamp}${eventsSecret}`)
    .digest("hex");
}

export function verifyEventChecksum(event: WompiEvent, eventsSecret: string): boolean {
  return eventChecksum(event, eventsSecret).toLowerCase() === event.signature.checksum.toLowerCase();
}
