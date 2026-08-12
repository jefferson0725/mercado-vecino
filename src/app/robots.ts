import type { MetadataRoute } from "next";

// Lee NEXT_PUBLIC_APP_URL en runtime: en el build de Docker aún no existe.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/api"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
