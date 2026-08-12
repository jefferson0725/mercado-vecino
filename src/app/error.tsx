"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="contenido" className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-6">
      <div className="w-full rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <h1 className="font-display text-xl font-bold text-neutral-900">Algo salió mal</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Ocurrió un error inesperado. Intenta de nuevo en un momento.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-strong"
        >
          <RefreshCw aria-hidden className="h-4 w-4" />
          Reintentar
        </button>
      </div>
    </main>
  );
}
