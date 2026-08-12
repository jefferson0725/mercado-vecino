export function StatusBadge({ isOpen }: { isOpen: boolean }) {
  return isOpen ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-strong">
      <span aria-hidden className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
      </span>
      Abierto
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
      Cerrado
    </span>
  );
}
