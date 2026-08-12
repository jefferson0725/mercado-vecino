import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div aria-label="Cargando panel" aria-busy="true" className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-12 w-full rounded-xl" />
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-1 h-4 w-64" />

        <div className="mt-4 space-y-4">
          {(["w-44", "w-36", "w-40", "w-32"] as const).map((w, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className={`h-4 ${w}`} />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="mt-2 h-11 w-full rounded-xl" />
        </div>
      </section>
    </div>
  );
}
