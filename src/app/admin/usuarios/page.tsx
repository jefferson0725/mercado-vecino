import Link from "next/link";
import Form from "next/form";
import { Search, SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { Pagination } from "@/components/Pagination";
import { setUserRole } from "../actions";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;
const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

function filterHref(rol?: string, q?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (rol) params.set("rol", rol);
  const query = params.toString();
  return `/admin/usuarios${query ? `?${query}` : ""}`;
}

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; rol?: string; pagina?: string }>;
}) {
  const [session, { q, rol, pagina }] = await Promise.all([getSession(), searchParams]);

  const busqueda = typeof q === "string" ? q.trim() : "";
  const rolActivo = rol === "ADMIN" || rol === "SELLER" ? rol : undefined;
  const page = Math.max(1, Number(pagina) || 1);

  const where: Prisma.UserWhereInput = {
    ...(busqueda && {
      OR: [
        { name: { contains: busqueda, mode: "insensitive" as const } },
        { email: { contains: busqueda, mode: "insensitive" as const } },
      ],
    }),
    ...(rolActivo && { role: rolActivo }),
  };

  const [usuarios, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        business: {
          select: { id: true, name: true, conjuntoId: true, conjunto: { select: { name: true } } },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const chipBase =
    "inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition";
  const chipOn = "border-primary bg-primary-soft text-primary-strong";
  const chipOff = "border-neutral-300 bg-white text-neutral-700 hover:border-primary/50";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Usuarios{" "}
        <span className="font-normal text-neutral-500">
          · {total} {total === 1 ? "registrado" : "registrados"}
        </span>
      </h2>

      <Form action="/admin/usuarios" role="search" className="flex gap-2">
        {rolActivo && <input type="hidden" name="rol" value={rolActivo} />}
        <label htmlFor="buscar-usuario" className="sr-only">
          Buscar usuario por nombre o email
        </label>
        <div className="relative w-full">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400"
          />
          <input
            id="buscar-usuario"
            type="search"
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar por nombre o email..."
            className="min-h-11 w-full rounded-xl border border-neutral-300 bg-white py-2.5 pr-3 pl-10 text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
        </div>
        <button
          type="submit"
          className="min-h-11 shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong"
        >
          Buscar
        </button>
      </Form>

      <nav aria-label="Filtrar usuarios por rol" className="flex flex-wrap gap-2">
        <Link
          href={filterHref(undefined, busqueda)}
          aria-current={!rolActivo ? "true" : undefined}
          className={`${chipBase} ${!rolActivo ? chipOn : chipOff}`}
        >
          Todos
        </Link>
        <Link
          href={filterHref("SELLER", busqueda)}
          aria-current={rolActivo === "SELLER" ? "true" : undefined}
          className={`${chipBase} ${rolActivo === "SELLER" ? chipOn : chipOff}`}
        >
          Vendedores
        </Link>
        <Link
          href={filterHref("ADMIN", busqueda)}
          aria-current={rolActivo === "ADMIN" ? "true" : undefined}
          className={`${chipBase} ${rolActivo === "ADMIN" ? chipOn : chipOff}`}
        >
          Admins
        </Link>
      </nav>

      {usuarios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <SearchX aria-hidden className="mx-auto h-8 w-8 text-neutral-400" />
          <p className="mt-3 text-sm text-neutral-600">
            {busqueda
              ? `Ningún usuario coincide con "${busqueda}".`
              : "No hay usuarios con este filtro."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {usuarios.map((user) => {
            const esActual = user.id === session?.user.id;
            const esAdmin = user.role === "ADMIN";
            return (
              <li key={user.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    {user.name}
                    {esActual && <span className="ml-1 font-normal text-neutral-500">(tú)</span>}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      esAdmin
                        ? "bg-primary-soft text-primary-strong"
                        : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {esAdmin ? "Admin" : "Vendedor"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  {user.email} · registrado el {fecha.format(user.createdAt)}
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  {user.business && (
                    <Link
                      href={`/admin/conjuntos/${user.business.conjuntoId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {user.business.name} · {user.business.conjunto.name}
                    </Link>
                  )}
                  {!esActual && (
                    <form action={setUserRole}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="role" value={esAdmin ? "SELLER" : "ADMIN"} />
                      <ConfirmSubmit
                        message={
                          esAdmin
                            ? `¿Quitar permisos de admin a ${user.name}?`
                            : `¿Convertir a ${user.name} en admin? Podrá gestionar todo el marketplace.`
                        }
                        className="text-neutral-600 hover:text-neutral-900"
                      >
                        {esAdmin ? "Quitar admin" : "Hacer admin"}
                      </ConfirmSubmit>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        basePath="/admin/usuarios"
        searchParams={{ q: busqueda || undefined, rol: rolActivo }}
      />
    </div>
  );
}
