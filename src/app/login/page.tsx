import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

// Con sesión activa no hay nada que iniciar: directo al panel que corresponda
export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }
  return <LoginForm />;
}
