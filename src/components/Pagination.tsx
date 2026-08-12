import Link from "next/link";

/**
 * Paginación por enlaces (?pagina=N) que preserva el resto de los
 * searchParams. Server component: no necesita JS en el cliente.
 */
export function Pagination({
  page,
  pageCount,
  basePath,
  searchParams,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "pagina") params.set(key, value);
    }
    if (target > 1) params.set("pagina", String(target));
    const query = params.toString();
    return `${basePath}${query ? `?${query}` : ""}`;
  };

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="font-medium text-primary hover:underline">
          ← Anterior
        </Link>
      ) : (
        <span aria-hidden className="text-neutral-400">
          ← Anterior
        </span>
      )}
      <span className="text-neutral-600">
        Página {page} de {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className="font-medium text-primary hover:underline">
          Siguiente →
        </Link>
      ) : (
        <span aria-hidden className="text-neutral-400">
          Siguiente →
        </span>
      )}
    </nav>
  );
}
