import { Prisma } from "@/generated/prisma/client";

/** Violación de unique constraint (P2002), opcionalmente sobre una columna concreta. */
export function isUniqueViolation(e: unknown, column?: string): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return false;
  if (!column) return true;
  const target = e.meta?.target;
  return Array.isArray(target)
    ? target.includes(column)
    : String(target ?? "").includes(column);
}

/**
 * Ejecuta `create(slug)` probando `base`, `base-2`, `base-3`... hasta que no
 * choque con el unique del slug. Crear-y-reintentar en vez de
 * consultar-y-crear: dos requests simultáneos no pueden reclamar el mismo
 * slug porque el árbitro es el constraint de la base de datos.
 */
export async function createWithUniqueSlug<T>(
  base: string,
  create: (slug: string) => Promise<T>,
  maxAttempts = 6
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const slug =
      attempt === 0
        ? base
        : attempt < maxAttempts
          ? `${base}-${attempt + 1}`
          : // Último recurso: sufijo aleatorio en vez de seguir contando
            `${base}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      return await create(slug);
    } catch (e) {
      if (attempt >= maxAttempts || !isUniqueViolation(e, "slug")) throw e;
    }
  }
}
