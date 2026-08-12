export async function register() {
  // Solo en el servidor Node real: ni en edge ni durante `next build`,
  // que corre con placeholders de env (ver Dockerfile).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { assertEnv } = await import("./lib/env");
  assertEnv();
}
