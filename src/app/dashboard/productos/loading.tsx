import { Skeleton } from "@/components/Skeleton";

export default function ProductosLoading() {
  return (
    <div aria-label="Cargando productos" aria-busy="true" className="space-y-4">
      <Skeleton className="h-10 w-full rounded-xl" />

      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-3"
          >
            <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-6 w-28 rounded-lg" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-10" />
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-14" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
