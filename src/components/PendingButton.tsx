"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function PendingButton({
  children,
  className = "",
  pendingLabel,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:opacity-60`}
    >
      {pending ? (
        <span className="inline-flex items-center gap-1.5">
          <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
          {pendingLabel ?? "Un momento..."}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
