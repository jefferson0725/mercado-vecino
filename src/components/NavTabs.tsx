"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export type NavTab = {
  href: string;
  label: string;
  Icon: LucideIcon;
  // Con exact solo coincide la ruta exacta (para el tab raíz de la sección)
  exact?: boolean;
};

export function NavTabs({ label, tabs }: { label: string; tabs: NavTab[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="mx-auto flex max-w-3xl flex-wrap gap-1 px-4 pb-2">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-primary-soft text-primary-strong"
                : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            <tab.Icon aria-hidden className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
