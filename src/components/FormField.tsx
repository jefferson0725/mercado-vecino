"use client";

import { useState } from "react";

export function FormField({
  label,
  hint,
  maxLength,
  defaultValue,
  ...inputProps
}: {
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [length, setLength] = useState(
    typeof defaultValue === "string" ? defaultValue.length : 0
  );

  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-sm font-medium text-neutral-700">
        <span>{label}</span>
        {maxLength !== undefined && (
          <span
            className={`text-xs font-normal tabular-nums ${
              length > maxLength * 0.9 ? "text-warn-text" : "text-neutral-400"
            }`}
            aria-live="polite"
          >
            {length}/{maxLength}
          </span>
        )}
      </span>
      <input
        {...inputProps}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChange={(e) => {
          setLength(e.target.value.length);
          inputProps.onChange?.(e);
        }}
        className="min-h-11 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
      />
      {hint && <span className="mt-1 block text-xs text-neutral-600">{hint}</span>}
    </label>
  );
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger" role="alert">
      {error}
    </p>
  );
}
