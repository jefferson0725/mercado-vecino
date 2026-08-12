import { requireBusiness } from "@/lib/session";
import { getCategories } from "@/lib/categories";
import { StatusBadge } from "@/components/StatusBadge";
import { isOpenNow, isWithinSchedule, describeSchedule } from "@/lib/schedule";
import { toggleOpen } from "./actions";
import { BusinessForm } from "./BusinessForm";
import { ToggleOpenButton } from "./ToggleOpenButton";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string }>;
}) {
  const [{ business }, allCategories, { bienvenida }] = await Promise.all([
    requireBusiness(),
    getCategories(),
    searchParams,
  ]);
  const abiertoAhora = isOpenNow(business);
  const cerradoPorHorario = business.isOpen && !isWithinSchedule(business);
  const horario = describeSchedule(business);

  return (
    <div className="space-y-6">
      {bienvenida === "1" && (
        <section className="rounded-2xl border border-primary/25 bg-primary-faint px-4 py-4 text-sm">
          <p className="font-semibold text-primary-strong">¡Bienvenido a Mercado Vecino!</p>
          <ul className="mt-1.5 list-inside list-disc space-y-1 text-primary-strong/80">
            <li>Te enviamos un enlace de verificación a tu correo — revísalo antes de continuar.</li>
            <li>El administrador de tu conjunto debe aprobar tu negocio para que aparezca en el catálogo.</li>
            <li>Mientras tanto puedes completar tu información y agregar productos.</li>
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-neutral-900">Estado del negocio</h2>
            <p className="mt-0.5 text-sm text-neutral-600">
              Así lo ven tus clientes ahora mismo:
            </p>
          </div>
          <StatusBadge isOpen={abiertoAhora} />
        </div>
        {cerradoPorHorario && horario && (
          <p className="mt-3 rounded-xl bg-warn-soft px-4 py-3 text-sm font-medium text-warn-text">
            Estás fuera de tu horario ({horario}): tus clientes te ven cerrado
            aunque el negocio esté activado.
          </p>
        )}
        <ToggleOpenButton action={toggleOpen} isOpen={business.isOpen} />
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold text-neutral-900">Información del negocio</h2>
        <p className="mt-0.5 text-sm text-neutral-600">
          Esto aparece en tu página pública dentro de {business.conjunto.name}.
        </p>
        <BusinessForm
          business={{
            name: business.name,
            description: business.description,
            whatsappNumber: business.whatsappNumber,
            logoUrl: business.logoUrl,
            categoryIds: business.categories.map((c) => c.id),
            opensAt: business.opensAt,
            closesAt: business.closesAt,
            openDays: business.openDays,
          }}
          allCategories={allCategories}
        />
      </section>
    </div>
  );
}
