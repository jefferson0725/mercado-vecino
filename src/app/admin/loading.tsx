import { Skeleton } from "@/components/Skeleton";

export default function AdminLoading() {
  return (
    <div aria-label="Cargando panel admin" aria-busy="true" className="space-y-6">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="rounded-2xl border border-neutral-100 bg-white p-4">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="mt-1 h-4 w-28" />
            <Skeleton className="mt-0.5 h-3 w-20" />
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-white p-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
