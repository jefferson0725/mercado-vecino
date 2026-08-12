"use client";

import { CreditCard, Package, Store } from "lucide-react";
import { NavTabs } from "@/components/NavTabs";

const tabs = [
  { href: "/dashboard", label: "Mi negocio", Icon: Store, exact: true },
  { href: "/dashboard/productos", label: "Productos", Icon: Package },
  { href: "/dashboard/suscripcion", label: "Suscripción", Icon: CreditCard },
];

export function DashboardNav() {
  return <NavTabs label="Secciones del panel" tabs={tabs} />;
}
