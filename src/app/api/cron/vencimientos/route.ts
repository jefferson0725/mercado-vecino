import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, expiryReminderEmail } from "@/lib/email";
import { WARN_DAYS } from "@/lib/subscription";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/cron/vencimientos
 *
 * Notifica por correo a los negocios cuya suscripción vence en los próximos
 * WARN_DAYS días. Protegido con Authorization: Bearer <CRON_SECRET>.
 *
 * Configurar en el VPS:
 *   0 8 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
 *     https://<dominio>/api/cron/vencimientos >> /var/log/ecommerce-cron.log 2>&1
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado" },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() + WARN_DAYS * DAY_MS);

  const negocios = await prisma.business.findMany({
    where: {
      approved: true,
      active: true,
      conjunto: { monthlyPrice: { gt: 0 } },
      paidUntil: {
        gte: now,      // aún vigente
        lte: cutoff,   // pero vence dentro de WARN_DAYS días
      },
    },
    include: {
      owner: { select: { email: true, name: true } },
      conjunto: { select: { name: true } },
    },
  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  let enviados = 0;
  for (const negocio of negocios) {
    try {
      await sendEmail({
        to: negocio.owner.email,
        subject: `Tu suscripción en ${negocio.conjunto.name} está por vencer`,
        html: expiryReminderEmail({
          businessName: negocio.name,
          conjuntoName: negocio.conjunto.name,
          paidUntil: negocio.paidUntil!,
          dashboardUrl: `${appUrl}/dashboard/suscripcion`,
        }),
      });
      enviados++;
    } catch (err) {
      console.error(`[cron/vencimientos] Error al enviar a ${negocio.owner.email}:`, err);
    }
  }

  return NextResponse.json({ enviados, total: negocios.length });
}
