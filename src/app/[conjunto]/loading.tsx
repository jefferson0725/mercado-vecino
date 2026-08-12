import { PublicHeader } from "@/components/PublicHeader";
import { Skeleton } from "@/components/Skeleton";

export default function ConjuntoLoading() {
  return (
    <>
      <PublicHeader />
      <main
        aria-label="Cargando negocios"
        aria-busy="true"
        className="mx-auto w-full max-w-3xl flex-1 px-4 py-8"
      >
        <Skeleton className="h-7 w-48 rounded-xl" />
        <Skeleton className="mt-2 h-4 w-36" />

        <Skeleton className="mt-4 h-11 w-full rounded-xl" />

        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-9 w-16 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>

        <ul className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-4"
            >
              <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
