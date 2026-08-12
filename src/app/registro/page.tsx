import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { RegistroForm } from "./RegistroForm";

// Quien ya tiene negocio (o es admin) va a su panel. Un usuario con sesión
// pero sin negocio sí debe ver el registro: requireBusiness lo manda aquí.
export default async function RegistroPage() {
  const session = await getSession();
  if (session) {
    if (session.user.role === "ADMIN") redirect("/admin");
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    if (business) redirect("/dashboard");
  }
  return <RegistroForm />;
}
