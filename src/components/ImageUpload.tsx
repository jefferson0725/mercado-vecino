"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Cropper from "react-easy-crop";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImagePreview } from "./ImagePreview";
import { FormError } from "./FormField";
import type { Area } from "react-easy-crop";

async function getCroppedBlob(src: string, pixels: Area): Promise<Blob> {
  const img = new window.Image();
  img.src = src;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });
  const canvas = document.createElement("canvas");
  canvas.width = pixels.width;
  canvas.height = pixels.height;
  canvas.getContext("2d")!.drawImage(img, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, pixels.width, pixels.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("crop failed"))), "image/webp", 0.92)
  );
}

export function ImageUpload({
  name,
  label,
  hint,
  initialUrl,
  aspect = 1,
  crop: enableCrop = true,
}: {
  name: string;
  label: string;
  hint?: string;
  initialUrl?: string | null;
  aspect?: number;
  crop?: boolean;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();

  const [srcImage, setSrcImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(undefined);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "No se pudo subir la imagen.");
      else { setUrl(data.url); toast.success("Foto subida"); }
    } catch {
      setError("No se pudo subir la imagen. Revisa tu conexión.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(undefined);
    if (!enableCrop) {
      uploadFile(file);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSrcImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!srcImage || !croppedPixels) return;
    const blob = await getCroppedBlob(srcImage, croppedPixels);
    await uploadFile(new File([blob], "crop.webp", { type: "image/webp" }));
    setSrcImage(null);
  }

  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Body scroll lock + Escape key + initial focus when crop modal is open
  useEffect(() => {
    if (!srcImage) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSrcImage(null);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [srcImage]);

  return (
    <>
      {srcImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Recortar imagen"
          className="fixed inset-0 z-50 flex flex-col bg-neutral-950/80"
        >
          <div className="relative flex-1">
            <Cropper
              image={srcImage}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="flex items-center justify-between gap-3 bg-white px-5 py-4 shadow-lg">
            <p className="text-sm text-neutral-500">
              Arrastra para encuadrar · pellizca o rueda para hacer zoom
            </p>
            <div className="flex gap-2">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={() => setSrcImage(null)}
                className="min-h-10 rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={uploading}
                aria-busy={uploading}
                className="flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-70"
              >
                {uploading ? (
                  <>
                    <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                    Subiendo…
                  </>
                ) : (
                  "Usar esta parte"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
        {hint && <p className="mb-2 text-xs text-neutral-500">{hint}</p>}
        <div className="flex items-center gap-3">
          {url ? (
            <ImagePreview
              src={url}
              alt="Vista previa"
              thumbnailClassName="h-16 w-16 rounded-xl border border-neutral-200 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-xs text-neutral-600">
              Sin foto
            </div>
          )}
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 ${uploading ? "cursor-not-allowed opacity-70" : ""}`}
          >
            {uploading ? (
              <>
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                Subiendo…
              </>
            ) : (
              url ? "Cambiar foto" : "Subir foto"
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
          {url && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="rounded-lg px-2 py-1.5 text-sm text-neutral-600 hover:text-danger"
            >
              Quitar
            </button>
          )}
        </div>
        <input type="hidden" name={name} value={url} />
        {error && <FormError error={error} />}
      </div>
    </>
  );
}
