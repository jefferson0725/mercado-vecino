// Variables sin las que la app no puede funcionar. Las tres de producción
// tienen fallbacks razonables en desarrollo (localhost), por eso solo se
// exigen con NODE_ENV=production.
const REQUIRED = ["DATABASE_URL"] as const;
const REQUIRED_IN_PRODUCTION = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "CRON_SECRET",
] as const;

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copia .env.example a .env y complétala.`
    );
  }
  return value;
}

/**
 * Falla al arrancar el servidor (src/instrumentation.ts) si falta
 * configuración, en vez de con un error críptico en el primer request.
 */
export function assertEnv() {
  const required: readonly string[] =
    process.env.NODE_ENV === "production"
      ? [...REQUIRED, ...REQUIRED_IN_PRODUCTION]
      : REQUIRED;
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${missing.join(", ")}. Copia .env.example a .env y complétala.`
    );
  }
}
