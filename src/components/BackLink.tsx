import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-9 items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-primary-strong"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white transition group-hover:border-primary/40 group-hover:bg-primary-faint">
        <ArrowLeft aria-hidden className="h-4 w-4" />
      </span>
      {label}
    </Link>
  );
}
