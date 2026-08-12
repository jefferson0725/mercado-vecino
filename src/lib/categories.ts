import { cache } from "react";
import { prisma } from "./prisma";

export type CategoryRow = { id: string; name: string; slug: string };

/** Todas las categorías ordenadas alfabéticamente. Deduplicada por request via cache(). */
export const getCategories = cache(async (): Promise<CategoryRow[]> => {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
});
