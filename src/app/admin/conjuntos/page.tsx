import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/utils";
import { CopyButton } from "@/components/CopyButton";
import { ConjuntoForm } from "./ConjuntoForm";
import { ConjuntoImageForm } from "./ConjuntoImageForm";
import { regenerateInviteCode, toggleConjuntoActive, updateConjuntoPrice } from "../actions";

export default async function AdminPage() {
  const conjuntos = await prisma.conjunto.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { businesses: true } } },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Nuevo conjunto</h2>
        <ConjuntoForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Conjuntos ({conjuntos.length})</h2>
        {conjuntos.map((conjunto) => (
          <div
            key={conjunto.id}
            className={`rounded-2xl border border-neutral-200 bg-white p-4 ${
              conjunto.active ? "" : "opacity-60"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link
                  href={`/admin/conjuntos/${conjunto.id}`}
                  className="font-semibold text-neutral-900 hover:underline"
                >
                  {conjunto.name}
                </Link>
                <p className="text-xs text-neutral-500">
                  /{conjunto.slug} · {conjunto._count.businesses}{" "}
                  {conjunto._count.businesses === 1 ? "negocio" : "negocios"} ·{" "}
                  {conjunto.monthlyPrice > 0
                    ? `${formatCOP(conjunto.monthlyPrice)}/mes`
                    : "sin cobro"}
                  {!conjunto.active && " · desactivado"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded-lg bg-neutral-100 px-2.5 py-1 text-sm font-semibold text-neutral-800">
                  {conjunto.inviteCode}
                </code>
                <CopyButton text={conjunto.inviteCode} />
              </div>
            </div>
            <ConjuntoImageForm conjuntoId={conjunto.id} imageUrl={conjunto.imageUrl ?? null} />
            <form action={updateConjuntoPrice} className="mt-3 flex items-center gap-2">
              <input type="hidden" name="id" value={conjunto.id} />
              <label
                htmlFor={`precio-${conjunto.id}`}
                className="text-sm font-medium text-neutral-700"
              >
                Suscripción mensual (COP)
              </label>
              <input
                id={`precio-${conjunto.id}`}
                type="number"
                name="monthlyPrice"
                defaultValue={conjunto.monthlyPrice}
                min={0}
                step={1000}
                className="min-h-10 w-32 rounded-xl border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
              <button
                type="submit"
                className="min-h-10 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-primary/50"
              >
                Guardar
              </button>
            </form>
            <div className="mt-3 flex gap-4 text-sm">
              <form action={regenerateInviteCode}>
                <input type="hidden" name="id" value={conjunto.id} />
                <button type="submit" className="text-neutral-600 hover:text-neutral-900">
                  Regenerar código
                </button>
              </form>
              <form action={toggleConjuntoActive}>
                <input type="hidden" name="id" value={conjunto.id} />
                <button
                  type="submit"
                  className={
                    conjunto.active
                      ? "text-neutral-600 hover:text-danger"
                      : "text-primary hover:underline"
                  }
                >
                  {conjunto.active ? "Desactivar" : "Activar"}
                </button>
              </form>
              <Link
                href={`/admin/conjuntos/${conjunto.id}`}
                className="ml-auto font-medium text-primary hover:underline"
              >
                Ver negocios →
              </Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
