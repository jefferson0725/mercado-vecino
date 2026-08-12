"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

/**
 * Se monta cuando el usuario vuelve del checkout de Wompi:
 * - Si hay un pago PENDING reciente: muestra aviso + hace refresh cada 4s
 *   hasta que el webhook lo resuelva (el Server Component pasará a mostrar
 *   el nuevo estado en el siguiente render).
 * - Si el último intento Wompi quedó DECLINED o ERROR: muestra un banner claro.
 */
export function WompiStatus({
  confirmando,
  lastWompiStatus,
}: {
  confirmando: boolean;
  lastWompiStatus?: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!confirmando) return;
    // Polling cada 4 s para actualizar el Server Component cuando el webhook
    // acredite el pago. Se detiene sola cuando `confirmando` pase a false
    // en el siguiente render (porque pendingWompi ya no existe).
    const id = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(id);
  }, [confirmando, router]);

  if (confirmando) {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-primary/25 bg-primary-faint px-4 py-3 text-sm font-medium text-primary-strong">
        <Loader2 aria-hidden className="h-4.5 w-4.5 shrink-0 animate-spin" />
        Confirmando tu pago con Wompi… se actualizará aquí en unos segundos.
      </p>
    );
  }

  if (lastWompiStatus === "DECLINED") {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
        <AlertCircle aria-hidden className="h-4.5 w-4.5 shrink-0" />
        Tu último intento de pago fue rechazado. Verifica el método de pago e intenta de nuevo.
      </p>
    );
  }

  if (lastWompiStatus === "ERROR" || lastWompiStatus === "VOIDED") {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
        <AlertCircle aria-hidden className="h-4.5 w-4.5 shrink-0" />
        El pago no pudo completarse (error en la pasarela). Intenta de nuevo o usa transferencia.
      </p>
    );
  }

  return null;
}
