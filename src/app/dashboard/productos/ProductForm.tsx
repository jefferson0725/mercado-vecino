"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveProduct, type ProductFormState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormField, FormError } from "@/components/FormField";
import { ImageUpload } from "@/components/ImageUpload";
import { LIMITS } from "@/lib/config";

const initialState: ProductFormState = {};

const PRICE_TYPES = [
  { value: "FIJO", label: "Precio fijo" },
  { value: "DESDE", label: "Desde (precio base)" },
  { value: "COTIZAR", label: "A cotizar por WhatsApp" },
] as const;

type PriceTypeValue = (typeof PRICE_TYPES)[number]["value"];

export function ProductForm({
  product,
  sections = [],
}: {
  product?: {
    id: string;
    name: string;
    description: string;
    price: number;
    priceType: PriceTypeValue;
    imageUrls: string[];
    available: boolean;
    sectionId: string | null;
  };
  sections?: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(saveProduct, initialState);
  const [priceType, setPriceType] = useState<PriceTypeValue>(
    product?.priceType ?? "FIJO"
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(product ? "Cambios guardados" : "Producto creado");
      router.push("/dashboard/productos");
    }
  }, [state.success, product, router]);

  return (
    <form action={formAction} className="space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="space-y-3">
        <p className="text-sm font-medium text-neutral-700">
          Fotos del producto <span className="font-normal text-neutral-500">(máximo 3)</span>
        </p>
        <p className="text-xs text-neutral-500">
          Cualquier tamaño. Recomendado: cuadrada (ej. 800×800 px). La primera es la principal.
        </p>
        {[0, 1, 2].map((i) => (
          <ImageUpload
            key={i}
            name={`imageUrl_${i}`}
            label={i === 0 ? "Foto principal" : `Foto ${i + 1} (opcional)`}
            initialUrl={product?.imageUrls[i] ?? null}
            crop={false}
          />
        ))}
      </div>
      {sections.length > 0 && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Sección</span>
          <select
            name="sectionId"
            defaultValue={product?.sectionId ?? ""}
            className="min-h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
          >
            <option value="">Sin sección</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      )}
      <FormField
        label="Nombre del producto"
        name="name"
        defaultValue={product?.name}
        placeholder="Caja x6 donas glaseadas"
        maxLength={LIMITS.productName}
        required
      />
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Descripción</span>
        <textarea
          name="description"
          rows={3}
          maxLength={LIMITS.description}
          defaultValue={product?.description}
          placeholder="Sabores, tamaños, tiempos de entrega..."
          className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
      </label>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-neutral-700">Tipo de precio</legend>
        <div className="flex flex-wrap gap-2">
          {PRICE_TYPES.map(({ value, label }) => (
            <label
              key={value}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary-strong"
            >
              <input
                type="radio"
                name="priceType"
                value={value}
                checked={priceType === value}
                onChange={() => setPriceType(value)}
                className="h-3.5 w-3.5 border-neutral-300 accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {priceType !== "COTIZAR" && (
        <FormField
          label="Precio (COP)"
          name="price"
          type="text"
          inputMode="numeric"
          defaultValue={product?.priceType !== "COTIZAR" ? product?.price : undefined}
          placeholder="18000"
          hint="Solo números, sin puntos ni decimales"
          required
        />
      )}

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="available"
          defaultChecked={product?.available ?? true}
          className="h-4 w-4 rounded border-neutral-300 accent-primary"
        />
        <span className="text-sm text-neutral-700">Disponible para pedir</span>
      </label>

      <FormError error={state.error} />
      <div className="flex gap-3">
        <Link
          href="/dashboard/productos"
          className="flex min-h-12 w-full items-center justify-center rounded-xl border border-neutral-300 px-4 py-3 font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          Cancelar
        </Link>
        <SubmitButton>{product ? "Guardar cambios" : "Crear producto"}</SubmitButton>
      </div>
    </form>
  );
}
