export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCOP(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Normaliza un número de WhatsApp colombiano a formato internacional sin "+".
 * "300 111 2233" -> "573001112233". Devuelve null si no parece válido.
 */
export function normalizeWhatsapp(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

export function waLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/**
 * Construye el mensaje de WhatsApp para pedir/cotizar un producto.
 * Centraliza la lógica para que `[negocio]` y `[producto]` usen el mismo texto.
 */
export function waProductMessage(
  productName: string,
  priceType: "FIJO" | "DESDE" | "COTIZAR",
  price: number,
  siteName: string
): string {
  if (priceType === "COTIZAR") {
    return `¡Hola! Quiero cotizar *${productName}* que vi en ${siteName}.`;
  }
  const priceText = formatCOP(price);
  if (priceType === "DESDE") {
    return `¡Hola! Quiero pedir *${productName}* (Desde ${priceText}) que vi en ${siteName}.`;
  }
  return `¡Hola! Quiero pedir *${productName}* (${priceText}) que vi en ${siteName}.`;
}

/**
 * Valida que una URL de imagen provenga de nuestro propio pipeline: o del
 * prefijo público de R2 (process.env.R2_PUBLIC_URL) o del disco local
 * (/uploads/). El string vacío es válido (sin imagen). Cualquier otra cosa
 * —incluidas URLs externas arbitrarias— se rechaza para que nada esquive
 * el paso sharp→webp de /api/upload.
 */
export function isValidImageUrl(value: string): boolean {
  if (value === "") return true;
  if (value.startsWith("/uploads/")) return true;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (publicUrl && value.startsWith(`${publicUrl}/`)) return true;
  return false;
}
