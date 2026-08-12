import { PublicHeader } from "@/components/PublicHeader";
import { Skeleton } from "@/components/Skeleton";

export default function NegocioLoading() {
  return (
    <>
      <PublicHeader />
      <main
        aria-label="Cargando negocio"
        aria-busy="true"
        className="mx-auto w-full max-w-3xl flex-1 pb-28"
      >
        <Skeleton className="h-44 w-full rounded-none sm:h-56 sm:rounded-b-3xl" />

        <div className="px-4 py-6">
          <Skeleton className="h-4 w-28" />

          <div className="mt-4 flex items-center gap-3">
            <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-3.5 w-1/4" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
          </div>

          <div className="mt-8">
            <Skeleton className="mb-3 h-3.5 w-20" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-neutral-100 bg-white"
                >
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="px-3 pb-3">
                    <Skeleton className="h-11 w-full rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <Skeleton className="h-14 w-full rounded-full" />
        </div>
      </main>
    </>
  );
}
