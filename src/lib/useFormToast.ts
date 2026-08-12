"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function useFormToast(
  state: { error?: string; success?: boolean },
  successMessage = "Guardado"
) {
  const prevRef = useRef(state);
  useEffect(() => {
    if (prevRef.current === state) return;
    prevRef.current = state;
    if (state.success) toast.success(successMessage);
  }, [state, successMessage]);
}
