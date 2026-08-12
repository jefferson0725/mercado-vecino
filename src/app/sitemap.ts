import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { publicBusinessWhere } from "@/lib/subscription";

// Consulta la base de datos: debe resolverse en cada request, no en el build
// de Docker (donde no hay base de datos disponible).
export const dynamic = "force-dynamic";

function baseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();

  const conjuntos = await prisma.conjunto.findMany({
    where: { active: true },
    select: {
      slug: true,
      businesses: {
        where: publicBusinessWhere(),
        select: {
          slug: true,
          updatedAt: true,
          products: {
            where: { available: true },
            select: { slug: true, updatedAt: true },
          },
        },
      },
    },
  });

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
  ];

  for (const conjunto of conjuntos) {
    entries.push({ url: `${base}/${conjunto.slug}`, changeFrequency: "daily", priority: 0.8 });
    for (const business of conjunto.businesses) {
      entries.push({
        url: `${base}/${conjunto.slug}/${business.slug}`,
        lastModified: business.updatedAt,
        changeFrequency: "daily",
        priority: 0.7,
      });
      for (const product of business.products) {
        entries.push({
          url: `${base}/${conjunto.slug}/${business.slug}/${product.slug}`,
          lastModified: product.updatedAt,
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
    }
  }

  return entries;
}
