import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

/** Sesión de vendedor con su negocio. Los admin van a /admin. */
export async function requireBusiness() {
  const session = await requireSession();
  if (session.user.role === "ADMIN") redirect("/admin");
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    include: { conjunto: true, categories: true },
  });
  if (!business) redirect("/registro");
  return { session, business };
}
