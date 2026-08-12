import nodemailer from "nodemailer";
import { SITE_NAME, SUBSCRIPTION } from "./config";

type Transporter = ReturnType<typeof nodemailer.createTransport>;
const globalForMail = globalThis as unknown as { mailer?: Transporter };

function getTransporter(): Transporter {
  if (globalForMail.mailer) return globalForMail.mailer;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  if (process.env.NODE_ENV !== "production") globalForMail.mailer = transporter;
  return transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = process.env.EMAIL_FROM ?? `${SITE_NAME} <no-reply@example.com>`;
  await getTransporter().sendMail({ from, to, subject, html });
}

const card = `max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e5e5;`;
const btn = `display:inline-block;background:#7C3AED;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:15px;margin:20px 0;`;
const footer = `color:#a3a3a3;font-size:12px;margin-top:24px;`;

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;padding:40px 16px;margin:0">
<div style="${card}">
${body}
<p style="${footer}">© ${new Date().getFullYear()} ${SITE_NAME}</p>
</div>
</body>
</html>`;
}

export function verificationEmail(url: string): string {
  return layout(`
<h2 style="margin:0 0 8px;font-size:20px;color:#111">Confirma tu correo electrónico</h2>
<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 4px">
  Solo un paso más: haz clic en el botón para verificar tu correo y que tu negocio
  aparezca en el catálogo de <strong>${SITE_NAME}</strong>.
</p>
<a href="${url}" style="${btn}">Verificar correo</a>
<p style="color:#888;font-size:13px">
  Si no creaste una cuenta en ${SITE_NAME}, ignora este mensaje.
  El enlace expira en 24 horas.
</p>`);
}

export function resetPasswordEmail(url: string): string {
  return layout(`
<h2 style="margin:0 0 8px;font-size:20px;color:#111">Restablece tu contraseña</h2>
<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 4px">
  Recibimos una solicitud para cambiar la contraseña de tu cuenta en ${SITE_NAME}.
  Haz clic en el botón para continuar.
</p>
<a href="${url}" style="${btn}">Cambiar contraseña</a>
<p style="color:#888;font-size:13px">
  Si no solicitaste este cambio, ignora este mensaje. El enlace expira en 1 hora.
</p>`);
}

export function expiryReminderEmail({
  businessName,
  conjuntoName,
  paidUntil,
  dashboardUrl,
}: {
  businessName: string;
  conjuntoName: string;
  paidUntil: Date;
  dashboardUrl: string;
}): string {
  const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(paidUntil);
  return layout(`
<h2 style="margin:0 0 8px;font-size:20px;color:#111">Tu suscripción está por vencer</h2>
<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 4px">
  Hola, la suscripción de <strong>${businessName}</strong> (${conjuntoName})
  en ${SITE_NAME} vence el <strong>${fecha}</strong>.
</p>
<p style="color:#555;font-size:15px;line-height:1.6">
  Si no renuevas a tiempo, tu negocio dejará de aparecer en el catálogo.
  Tienes ${SUBSCRIPTION.graceDays} días adicionales de gracia tras el vencimiento.
</p>
<a href="${dashboardUrl}" style="${btn}">Renovar suscripción</a>
<p style="color:#888;font-size:13px">
  ¿Ya pagaste por transferencia? Espera a que el administrador registre tu pago.
</p>`);
}
