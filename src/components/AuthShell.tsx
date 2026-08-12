import Image from "next/image";
import Link from "next/link";

/** Marco compartido de /login y /registro: marca, atmósfera y tarjeta. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main
      id="contenido"
      className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-primary-faint via-transparent to-transparent px-4 py-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-primary-soft/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-primary-soft/40 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-6 flex justify-center">
          <Image
            src="/brand/logo-full.webp"
            alt="Mercado Vecino"
            width={128}
            height={128}
            priority
            className="h-28 w-auto sm:h-32 object-contain"
          />
        </Link>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="font-display text-2xl font-bold text-neutral-900">{title}</h1>
          <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
