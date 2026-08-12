"use client";

import { useState, useEffect } from "react";
import { MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const COOLDOWN_S = 60;

export function VerifyEmailBanner({
  email,
  inline = false,
}: {
  email: string;
  inline?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function handleResend() {
    setStatus("sending");
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/dashboard",
    });
    if (error) {
      setStatus("error");
    } else {
      setStatus("sent");
      setCooldown(COOLDOWN_S);
    }
  }

  const content = (
    <div className="flex flex-wrap items-start gap-3">
      {!inline && <MailCheck aria-hidden className="mt-0.5 h-4.5 w-4.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p>
          {inline ? "○ " : ""}Verifica tu correo electrónico.
          Te enviamos un enlace a <span className="font-semibold">{email}</span>.
        </p>
        {status === "sent" && (
          <p className="mt-1 font-normal text-warn-text/80">
            ✓ Correo reenviado. Revisa tu bandeja (y la carpeta de spam).
          </p>
        )}
        {status === "error" && (
          <p className="mt-1 font-normal text-danger">
            No se pudo reenviar el correo. Intenta de nuevo más tarde.
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={status === "sending" || cooldown > 0}
        onClick={handleResend}
        className="shrink-0 rounded-lg border border-warn-text/30 bg-white/60 px-3 py-1 text-xs font-semibold text-warn-text transition hover:bg-white/80 disabled:opacity-60"
      >
        {status === "sending"
          ? "Enviando..."
          : cooldown > 0
            ? `Reenviar en ${cooldown}s`
            : "Reenviar correo"}
      </button>
    </div>
  );

  if (inline) return content;

  return (
    <div className="mb-6 rounded-2xl border border-warn-text/25 bg-warn-soft px-4 py-3 text-sm font-medium text-warn-text">
      {content}
    </div>
  );
}
