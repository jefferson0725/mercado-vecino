import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCOP } from "@/lib/utils";
import { BackLink } from "@/components/BackLink";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { AdminActionButton } from "@/components/AdminActionButton";
import { subscriptionStatus } from "@/lib/subscription";
import {
  approveBusiness,
  rejectBusiness,
  toggleBusinessActive,
  registerManualPayment,
  adminToggleProductModerated,
} from "../../../actions";

const fecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

export default async function AdminBusinessPage({
  params,
}: {
  params: Promise<{ id: string; businessId: string }>;
}) {
  const { id, businessId } = await params;

  const business = await prisma.business.findUnique({
    where: { id: businessId, conjuntoId: id },
    include: {
      conjunto: { select: { name: true, slug: true, monthlyPrice: true } },
      owner: { select: { name: true, email: true } },
      products: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        include: { section: { select: { name: true } } },
      },
      _count: { select: { products: true } },
    },
  });
  if (!business) notFound();

  const suscripcion = business.approved
    ? subscriptionStatus(business.paidUntil, business.conjunto.monthlyPrice)
    : null;

  return (
    <div className="space-y-6">
      <nav aria-label="Volver al conjunto">
        <BackLink href={`/admin/conjuntos/${id}`} label={business.conjunto.name} />
      </nav>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">{business.name}</h2>
            <p className="mt-0.5 break-all text-sm text-neutral-600">
              {business.owner.name} · {business.owner.email}
            </p>
            <p className="break-all text-sm text-neutral-600">WhatsApp: {business.whatsappNumber}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {!business.approved && (
              <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn-text">
                Pendiente
              </span>
            )}
            {!business.active && (
              <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
                Desactivado
              </span>
            )}
            {suscripcion === "activa" && business.paidUntil && (
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-strong">
                Al día hasta {fecha.format(business.paidUntil)}
              </span>
            )}
            {suscripcion === "gracia" && business.paidUntil && (
              <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn-text">
                En gracia hasta {fecha.format(business.paidUntil)}
              </span>
            )}
            {suscripcion === "vencida" && (
              <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
                Suscripción vencida
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-neutral-100 pt-4 text-sm">
          {business.approved ? (
            <>
              <Link
                href={`/${business.conjunto.slug}/${business.slug}`}
                className="font-medium text-primary hover:underline"
                target="_blank"
              >
                Ver página pública
              </Link>
              {suscripcion && suscripcion !== "exenta" && (
                <form action={registerManualPayment}>
                  <input type="hidden" name="id" value={business.id} />
                  <ConfirmSubmit
                    message={`¿Registrar 1 mes de pago manual para "${business.name}"?`}
                    successMessage="Pago manual registrado (+1 mes)"
                    className="text-neutral-600 hover:text-neutral-900"
                  >
                    Registrar pago manual (+1 mes)
                  </ConfirmSubmit>
                </form>
              )}
              <form action={toggleBusinessActive}>
                <input type="hidden" name="id" value={business.id} />
                <ConfirmSubmit
                  message={
                    business.active
                      ? `¿Desactivar "${business.name}"? Dejará de aparecer en el catálogo.`
                      : `¿Reactivar "${business.name}"?`
                  }
                  successMessage={business.active ? "Negocio desactivado" : "Negocio reactivado"}
                  className={business.active ? "text-neutral-600 hover:text-danger" : "text-primary hover:underline"}
                >
                  {business.active ? "Desactivar negocio" : "Activar negocio"}
                </ConfirmSubmit>
              </form>
            </>
          ) : (
            <>
              <AdminActionButton
                action={approveBusiness}
                formData={{ id: business.id }}
                successMessage={`"${business.name}" aprobado`}
                className="font-medium text-primary hover:underline"
              >
                Aprobar negocio
              </AdminActionButton>
              <form action={rejectBusiness}>
                <input type="hidden" name="id" value={business.id} />
                <ConfirmSubmit
                  message={`¿Rechazar y eliminar "${business.name}"? Esta acción no se puede deshacer.`}
                  successMessage={`"${business.name}" rechazado y eliminado`}
                  className="text-neutral-600 hover:text-danger"
                >
                  Rechazar y eliminar
                </ConfirmSubmit>
              </form>
            </>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-neutral-900">
          Productos{" "}
          <span className="font-normal text-neutral-500">· {business._count.products}</span>
        </h3>

        {business.products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
            <Package aria-hidden className="mx-auto h-8 w-8 text-neutral-400" />
            <p className="mt-3 text-sm text-neutral-600">Este negocio aún no tiene productos.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {business.products.map((product) => (
              <li
                key={product.id}
                className={`flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 ${
                  product.moderatedOff ? "opacity-60" : ""
                }`}
              >
                {product.imageUrls[0] ? (
                  <Image
                    src={product.imageUrls[0]}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-xl border border-neutral-100 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs text-neutral-400">
                    Sin foto
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-neutral-900">{product.name}</p>
                    {product.moderatedOff && (
                      <span className="shrink-0 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                        Moderado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600">
                    {product.priceType === "COTIZAR"
                      ? "A cotizar"
                      : product.priceType === "DESDE"
                        ? `Desde ${formatCOP(product.price)}`
                        : formatCOP(product.price)}
                  </p>
                  {product.section && (
                    <p className="text-xs text-neutral-400">{product.section.name}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5 text-sm">
                  {!product.moderatedOff && (
                    <Link
                      href={`/${business.conjunto.slug}/${business.slug}/${product.slug}`}
                      className="font-medium text-primary hover:underline"
                      target="_blank"
                    >
                      Ver
                    </Link>
                  )}
                  <form action={adminToggleProductModerated}>
                    <input type="hidden" name="id" value={product.id} />
                    <ConfirmSubmit
                      message={
                        product.moderatedOff
                          ? `¿Restaurar "${product.name}"? El vendedor podrá verlo y modificarlo de nuevo.`
                          : `¿Moderar "${product.name}"? Desaparecerá de la vitrina y el vendedor no podrá reactivarlo.`
                      }
                      successMessage={product.moderatedOff ? "Producto restaurado" : "Producto moderado"}
                      className={product.moderatedOff ? "text-primary hover:underline" : "text-neutral-600 hover:text-danger"}
                    >
                      {product.moderatedOff ? "Restaurar" : "Moderar"}
                    </ConfirmSubmit>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
