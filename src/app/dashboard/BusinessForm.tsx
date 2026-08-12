"use client";

import { useActionState } from "react";
import { updateBusiness, type BusinessFormState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { FormField, FormError } from "@/components/FormField";
import { PhoneField } from "@/components/PhoneField";
import { ImageUpload } from "@/components/ImageUpload";
import { WEEKDAYS, WEEKDAY_KEYS } from "@/lib/schedule";
import type { CategoryRow } from "@/lib/categories";
import { LIMITS } from "@/lib/config";
import { useFormToast } from "@/lib/useFormToast";

const initialState: BusinessFormState = {};

export function BusinessForm({
  business,
  allCategories,
}: {
  business: {
    name: string;
    description: string;
    whatsappNumber: string;
    logoUrl: string | null;
    categoryIds: string[];
    opensAt: string | null;
    closesAt: string | null;
    openDays: string[];
  };
  allCategories: CategoryRow[];
}) {
  const [state, formAction] = useActionState(updateBusiness, initialState);
  useFormToast(state, "Cambios guardados");

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <ImageUpload
        name="logoUrl"
        label="Foto de portada del negocio"
        hint="Horizontal, mínimo 1200×480 px. Se muestra como banner en la parte superior de tu página."
        initialUrl={business.logoUrl}
        aspect={5 / 2}
      />
      <FormField
        label="Nombre del negocio"
        name="name"
        defaultValue={business.name}
        maxLength={LIMITS.businessName}
        required
      />
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Descripción</span>
        <textarea
          name="description"
          rows={3}
          maxLength={LIMITS.description}
          defaultValue={business.description}
          placeholder="Cuenta qué vendes, cómo entregas, horarios..."
          className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
      </label>
      <PhoneField
        label="WhatsApp para recibir pedidos"
        name="whatsapp"
        defaultValue={business.whatsappNumber}
        hint="El número donde te llegarán los pedidos"
        required
      />

      <fieldset>
        <legend className="mb-1 block text-sm font-medium text-neutral-700">
          Categorías
        </legend>
        <p className="mb-2 text-xs text-neutral-600">
          Marca las que describan tu negocio: así te encuentran al filtrar.
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {allCategories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="categories"
                value={cat.id}
                defaultChecked={business.categoryIds.includes(cat.id)}
                className="h-4 w-4 rounded border-neutral-300 accent-primary"
              />
              <span className="text-sm text-neutral-700">{cat.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 block text-sm font-medium text-neutral-700">
          Horario de atención (opcional)
        </legend>
        <p className="mb-2 text-xs text-neutral-600">
          Fuera de estos días y horas tu negocio aparece cerrado automáticamente.
          Déjalo vacío para manejarlo solo con el botón de abrir/cerrar.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {WEEKDAY_KEYS.map((day) => (
            <label
              key={day}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary-strong"
            >
              <input
                type="checkbox"
                name="openDays"
                value={day}
                defaultChecked={business.openDays.includes(day)}
                className="h-3.5 w-3.5 rounded border-neutral-300 accent-primary"
              />
              {WEEKDAYS[day].short}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex-1">
            <span className="mb-1 block text-xs text-neutral-600">Abre a las</span>
            <input
              type="time"
              name="opensAt"
              defaultValue={business.opensAt ?? ""}
              className="min-h-11 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
            />
          </label>
          <label className="flex-1">
            <span className="mb-1 block text-xs text-neutral-600">Cierra a las</span>
            <input
              type="time"
              name="closesAt"
              defaultValue={business.closesAt ?? ""}
              className="min-h-11 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
            />
          </label>
        </div>
      </fieldset>

      <FormError error={state.error} />
      <SubmitButton>Guardar cambios</SubmitButton>
    </form>
  );
}
