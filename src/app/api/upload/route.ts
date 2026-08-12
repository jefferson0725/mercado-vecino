import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { saveImage } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const UPLOAD_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 };

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.emailVerified) {
    return NextResponse.json(
      { error: "Confirma tu correo electrónico antes de subir imágenes." },
      { status: 403 }
    );
  }

  if (!await rateLimit(`upload:${session.user.id}`, UPLOAD_LIMIT)) {
    return NextResponse.json(
      { error: "Has subido muchas imágenes seguidas. Espera unos minutos." },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No llegó ningún archivo" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usa JPG, PNG o WebP." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "La imagen no puede superar 5 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // No basta con confiar en file.type (lo declara el cliente): dejamos que sharp
  // decodifique de verdad. Si no es una imagen real que pueda leer, es 400.
  let processed: Buffer;
  try {
    processed = await sharp(buffer)
      .rotate()
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return NextResponse.json(
      { error: "El archivo no es una imagen válida. Usa JPG, PNG o WebP." },
      { status: 400 }
    );
  }

  // La carpeta sale de la sesión (conjunto/negocio del vendedor), nunca del cliente
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { slug: true, conjunto: { select: { slug: true } } },
  });
  const folder = business ? `${business.conjunto.slug}/${business.slug}` : "otros";

  const hint = formData.get("hint");
  const name = typeof hint === "string" ? hint : undefined;

  const url = await saveImage(processed, { folder, name });
  return NextResponse.json({ url });
}
