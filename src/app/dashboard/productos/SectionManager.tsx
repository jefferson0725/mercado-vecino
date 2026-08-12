"use client";

import { useRef, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  createSection,
  deleteSection,
  moveSectionDown,
  moveSectionUp,
  renameSection,
} from "./sectionActions";

type Section = { id: string; name: string; sortOrder: number };

function RenamingRow({ section, onCancel }: { section: Section; onCancel: () => void }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onCancel();
    startTransition(async () => {
      await renameSection(formData);
      toast.success("Sección renombrada");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input type="hidden" name="id" value={section.id} />
      <input
        name="name"
        defaultValue={section.name}
        autoFocus
        required
        maxLength={60}
        className="min-h-9 flex-1 rounded-xl border border-primary px-3 py-1.5 text-sm outline-none ring-2 ring-primary-soft"
      />
      <button type="submit" disabled={isPending} aria-label="Confirmar" className="text-primary hover:text-primary-strong disabled:opacity-50">
        <Check className="h-4 w-4" />
      </button>
      <button type="button" onClick={onCancel} aria-label="Cancelar" className="text-neutral-500 hover:text-neutral-900">
        <X className="h-4 w-4" />
      </button>
    </form>
  );
}

function SectionRow({
  section,
  isFirst,
  isLast,
}: {
  section: Section;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (renaming) return <RenamingRow section={section} onCancel={() => setRenaming(false)} />;

  function handleDeleteConfirmed() {
    setConfirming(false);
    const formData = new FormData();
    formData.set("id", section.id);
    startTransition(async () => {
      await deleteSection(formData);
      toast.success("Sección eliminada");
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2">
        <span className="flex-1 text-xs font-medium text-danger">
          ¿Eliminar "{section.name}"? Los productos quedarán sin sección.
        </span>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleDeleteConfirmed}
          className="shrink-0 rounded-lg bg-danger px-2 py-1 text-xs font-semibold text-white hover:brightness-95"
        >
          Eliminar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 truncate text-sm font-medium text-neutral-800">{section.name}</span>
      <form action={moveSectionUp}>
        <input type="hidden" name="id" value={section.id} />
        <button
          type="submit"
          disabled={isFirst || isPending}
          aria-label="Subir sección"
          className="rounded-lg p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </form>
      <form action={moveSectionDown}>
        <input type="hidden" name="id" value={section.id} />
        <button
          type="submit"
          disabled={isLast || isPending}
          aria-label="Bajar sección"
          className="rounded-lg p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </form>
      <button
        type="button"
        onClick={() => setRenaming(true)}
        disabled={isPending}
        aria-label="Renombrar sección"
        className="rounded-lg p-1 text-neutral-400 hover:text-primary disabled:opacity-30"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={isPending}
        aria-label="Eliminar sección"
        className="rounded-lg p-1 text-neutral-400 hover:text-danger disabled:opacity-30"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SectionManager({ sections }: { sections: Section[] }) {
  const [adding, setAdding] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleCreate(formData: FormData) {
    await createSection(formData);
    setAdding(false);
    formRef.current?.reset();
    toast.success("Sección creada");
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-700">Secciones del menú</h3>

      {sections.length === 0 && !adding && (
        <p className="mb-3 text-sm text-neutral-500">
          Sin secciones. Crea una para organizar tu menú en grupos como &quot;Hamburguesas&quot; o &quot;Bebidas&quot;.
        </p>
      )}

      <ul className="space-y-2">
        {sections.map((s, i) => (
          <li key={s.id}>
            <SectionRow section={s} isFirst={i === 0} isLast={i === sections.length - 1} />
          </li>
        ))}
      </ul>

      {adding ? (
        <form ref={formRef} action={handleCreate} className="mt-3 flex items-center gap-2">
          <input
            name="name"
            autoFocus
            required
            maxLength={60}
            placeholder="Ej: Hamburguesas"
            className="min-h-9 flex-1 rounded-xl border border-primary px-3 py-1.5 text-sm outline-none ring-2 ring-primary-soft"
          />
          <button type="submit" className="min-h-9 rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-strong">
            Crear
          </button>
          <button type="button" onClick={() => setAdding(false)} className="rounded-lg p-1.5 text-neutral-500 hover:text-neutral-900">
            <X className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Plus className="h-4 w-4" />
          Nueva sección
        </button>
      )}
    </div>
  );
}
