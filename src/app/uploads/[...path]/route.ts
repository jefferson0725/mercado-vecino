import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

// Segmentos generados por nosotros (slugs y sufijos): evita path traversal
const SEGMENT_REGEX = /^[a-z0-9][a-z0-9-]*$/;
const FILENAME_REGEX = /^[a-z0-9][a-z0-9-]*\.webp$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filename = segments.at(-1);
  const folders = segments.slice(0, -1);
  if (
    !filename ||
    !FILENAME_REGEX.test(filename) ||
    !folders.every((segment) => SEGMENT_REGEX.test(segment))
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const dir = process.env.UPLOADS_DIR ?? "./data/uploads";
  try {
    const data = await readFile(path.join(dir, ...segments));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
