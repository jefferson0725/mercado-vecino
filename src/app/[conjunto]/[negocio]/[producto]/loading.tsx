import { PublicHeader } from "@/components/PublicHeader";
import { Skeleton } from "@/components/Skeleton";

export default function ProductoLoading() {
  return (
    <>
      <PublicHeader />
      <main
        aria-label="Cargando producto"
        aria-busy="true"
        className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-28"
      >
        <Skeleton className="h-4 w-28" />

        <Skeleton className="mt-4 aspect-square w-full rounded-2xl sm:rounded-3xl" />

        <div className="mt-6 space-y-3">
          <Skeleton className="h-7 w-3/5 rounded-xl" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <Skeleton className="h-14 w-full rounded-full" />
        </div>
      </main>
    </>
  );
}
