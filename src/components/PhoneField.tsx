"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { COUNTRIES, splitPhone, type Country } from "@/lib/countries";

/**
 * Campo de teléfono con selector de país (Colombia por defecto).
 * Envía `name` como un solo valor: indicativo + número, solo dígitos,
 * compatible con normalizeWhatsapp del servidor.
 */
export function PhoneField({
  label,
  name,
  defaultValue = "",
  hint,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
  required?: boolean;
}) {
  const initial = useMemo(() => splitPhone(defaultValue), [defaultValue]);
  const [country, setCountry] = useState<Country>(initial.country);
  const [number, setNumber] = useState(initial.number);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const inputId = useId();

  // Cierra al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const filtered = COUNTRIES.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dial.startsWith(q.replace(/^\+/, ""))
    );
  });

  function choose(c: Country) {
    setCountry(c);
    setOpen(false);
    setQuery("");
    buttonRef.current?.focus();
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const options = Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>("[role=option]") ?? []
    );
    if (options.length === 0) return;
    const index = options.findIndex((o) => o === document.activeElement);
    let next: HTMLElement | null | undefined;
    if (e.key === "ArrowDown") {
      next = options[Math.min(index + 1, options.length - 1)];
    } else if (e.key === "ArrowUp") {
      next = index <= 0 ? searchRef.current : options[index - 1];
    } else if (e.key === "Home") {
      next = options[0];
    } else if (e.key === "End") {
      next = options[options.length - 1];
    }
    next?.focus();
  }

  const fullValue = number.trim() ? `${country.dial}${number.replace(/\D/g, "")}` : "";

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <div className="flex gap-2">
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-label={`País: ${country.name} (+${country.dial})`}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-neutral-900 transition hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary-soft"
        >
          <span aria-hidden className="text-lg leading-none">{country.flag}</span>
          <span className="text-sm font-medium">+{country.dial}</span>
          <ChevronDown
            aria-hidden
            className={`h-4 w-4 text-neutral-500 transition ${open ? "rotate-180" : ""}`}
          />
        </button>
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="300 123 4567"
          value={number}
          required={required}
          onChange={(e) => setNumber(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
      </div>
      {hint && <span className="mt-1 block text-xs text-neutral-600">{hint}</span>}
      <input type="hidden" name={name} value={fullValue} />

      {open && (
        <div
          onKeyDown={onListKeyDown}
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg"
        >
          <div className="relative border-b border-neutral-100 p-2">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-5 h-4 w-4 -translate-y-1/2 text-neutral-400"
            />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar país o indicativo..."
              aria-label="Buscar país o indicativo"
              className="min-h-10 w-full rounded-lg bg-neutral-100 py-2 pr-3 pl-9 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-primary-soft"
            />
          </div>
          <ul id={listboxId} role="listbox" aria-label="Países" className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-neutral-500">Sin resultados.</li>
            )}
            {filtered.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.code === country.code}
                  onClick={() => choose(c)}
                  className={`flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-primary-faint ${
                    c.code === country.code ? "bg-primary-faint font-medium text-primary-strong" : "text-neutral-800"
                  }`}
                >
                  <span aria-hidden className="text-lg leading-none">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-neutral-500">+{c.dial}</span>
                  {c.code === country.code && (
                    <Check aria-hidden className="h-4 w-4 text-primary" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
