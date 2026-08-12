import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-8"
    >
      <Skeleton className="h-7 w-48 rounded-xl" />
      <Skeleton className="mt-3 h-4 w-64" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
