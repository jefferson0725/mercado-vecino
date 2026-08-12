"use client";

import { Building2, CreditCard, LayoutDashboard, Tags, Users } from "lucide-react";
import { NavTabs } from "@/components/NavTabs";

const tabs = [
  { href: "/admin", label: "Inicio", Icon: LayoutDashboard, exact: true },
  { href: "/admin/conjuntos", label: "Conjuntos", Icon: Building2 },
  { href: "/admin/suscripciones", label: "Suscripciones", Icon: CreditCard },
  { href: "/admin/usuarios", label: "Usuarios", Icon: Users },
  { href: "/admin/categorias", label: "Categorías", Icon: Tags },
];

export function AdminNav() {
  return <NavTabs label="Secciones de administración" tabs={tabs} />;
}
