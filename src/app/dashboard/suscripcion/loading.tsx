import { Skeleton } from "@/components/Skeleton";

export default function SuscripcionLoading() {
  return (
    <div aria-label="Cargando suscripción" aria-busy="true" className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-1.5 h-4 w-72" />
        <Skeleton className="mt-3 h-12 w-full rounded-xl" />
        <Skeleton className="mt-4 h-12 w-full rounded-xl" />
        <Skeleton className="mt-4 h-20 w-full rounded-xl" />
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <Skeleton className="h-5 w-44" />
        <ul className="mt-3 divide-y divide-neutral-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2.5">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </li>
          ))}
        </ul>
      </section>

      <Skeleton className="h-3 w-full max-w-sm" />
    </div>
  );
}
