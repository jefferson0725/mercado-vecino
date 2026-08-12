import { Skeleton } from "@/components/Skeleton";

export default function NuevoProductoLoading() {
  return (
    <div
      aria-label="Cargando formulario de producto"
      aria-busy="true"
      className="rounded-2xl border border-neutral-200 bg-white p-5"
    >
      <Skeleton className="h-6 w-40" />
      <div className="mt-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="mt-2 h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
