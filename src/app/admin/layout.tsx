import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
import { SignOutButton } from "@/components/SignOutButton";
import { SITE_NAME } from "@/lib/config";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-display font-bold leading-tight">Administración</h1>
            <Link
              href="/"
              className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
            >
              Ver {SITE_NAME}
              <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </div>
          <SignOutButton />
        </div>
        <AdminNav />
      </header>
      <main id="contenido" className="mx-auto w-full max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
