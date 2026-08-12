import { randomUUID } from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { slugify } from "./utils";

/**
 * Guarda una imagen ya procesada (webp) y devuelve su URL pública.
 * Con las variables R2_* configuradas sube a Cloudflare R2;
 * si no, cae al disco local (desarrollo) servido por /uploads/[...path].
 *
 * La clave sigue la forma `conjunto/negocio/nombre-xxxxxxxx.webp`: el sufijo
 * aleatorio la hace única e inmutable (cacheable por siempre) aunque dos
 * productos compartan nombre o se vuelva a subir la misma foto.
 */

function r2Config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } =
    process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) {
    return null;
  }
  return {
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucket: R2_BUCKET,
    publicUrl: R2_PUBLIC_URL.replace(/\/$/, ""),
  };
}

let s3: S3Client | undefined;

export async function saveImage(
  webpBuffer: Buffer,
  options?: { folder?: string; name?: string }
): Promise<string> {
  const suffix = randomUUID().slice(0, 8);
  const base = options?.name ? slugify(options.name).slice(0, 40) : "";
  const filename = base ? `${base}-${suffix}.webp` : `${suffix}.webp`;
  const folder = options?.folder
    ? options.folder
        .split("/")
        .map((segment) => slugify(segment))
        .filter(Boolean)
        .join("/")
    : "";
  const key = folder ? `${folder}/${filename}` : filename;
  const r2 = r2Config();

  if (r2) {
    s3 ??= new S3Client({
      region: "auto",
      endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2.accessKeyId,
        secretAccessKey: r2.secretAccessKey,
      },
    });
    await s3.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: webpBuffer,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return `${r2.publicUrl}/${key}`;
  }

  const dir = process.env.UPLOADS_DIR ?? "./data/uploads";
  const filePath = path.join(dir, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, webpBuffer);
  return `/uploads/${key}`;
}
