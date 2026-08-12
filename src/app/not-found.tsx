import Link from "next/link";
import { SearchX } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main id="contenido" className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-6">
        <div className="w-full rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <SearchX aria-hidden className="mx-auto h-8 w-8 text-neutral-400" />
          <h1 className="mt-3 font-display text-xl font-bold text-neutral-900">
            Página no encontrada
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            El enlace puede estar mal escrito o el contenido ya no existe.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-strong"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    </>
  );
}
