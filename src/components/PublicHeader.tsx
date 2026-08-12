import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/brand/logo-mark.webp"
            alt=""
            aria-hidden
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <span className="font-display text-lg font-bold tracking-tight text-neutral-900">
            {SITE_NAME}
          </span>
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary/30 bg-primary-faint px-4 py-2 text-sm font-semibold text-primary-strong transition hover:border-primary/60 hover:bg-primary-soft"
        >
          Vende aquí
        </Link>
      </div>
    </header>
  );
}
