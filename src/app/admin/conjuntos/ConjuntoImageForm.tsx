"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { updateConjuntoImage } from "../actions";

export function ConjuntoImageForm({
  conjuntoId,
  imageUrl,
}: {
  conjuntoId: string;
  imageUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateConjuntoImage(formData);
      toast.success("Foto guardada");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <input type="hidden" name="id" value={conjuntoId} />
      <ImageUpload
        name="imageUrl"
        label="Foto del conjunto"
        hint="Horizontal, mínimo 1200×480 px. Se muestra como banner en la página de inicio."
        initialUrl={imageUrl}
        aspect={5 / 2}
      />
      <button
        type="submit"
        disabled={isPending}
        className="min-h-10 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-primary/50 disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar foto"}
      </button>
    </form>
  );
}
