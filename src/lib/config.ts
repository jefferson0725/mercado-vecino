export const SITE_NAME = "Mercado Vecino";
export const SITE_DESCRIPTION =
  "Los negocios de tu conjunto residencial, en un solo lugar. Pide directo por WhatsApp.";

// Límites compartidos entre server actions (validación real) y formularios
// (maxLength como primera barrera en el cliente).
export const LIMITS = {
  userName: 60,
  businessName: 80,
  productName: 80,
  description: 500,
  // Precio máximo en COP; también protege el Int de Postgres (máx ~2.147M)
  priceMax: 100_000_000,
} as const;

// Suscripción mensual que pagan los negocios (el precio lo define cada
// conjunto; 0 = exento). Vencida la vigencia + gracia, el negocio sale del
// catálogo hasta pagar.
export const SUBSCRIPTION = {
  // Días de vigencia gratis al aprobarse el negocio
  trialDays: 15,
  // Días tras el vencimiento en los que el negocio sigue visible (con avisos)
  graceDays: 5,
} as const;

// Instrucciones que ve el vendedor para pagar por fuera de Wompi (el admin
// registra el pago a mano en el panel). Edita estos datos con los tuyos.
export const MANUAL_PAYMENT = {
  method: "cuenta de ahorros Nu",
  account: "0000000000-0",
  holder: "Administrador de Mercado Vecino",
} as const;
