import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

function createClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  client.on("error", () => {
    // Silenciar errores de conexión — el código que lo usa tiene fallback en memoria
  });

  return client;
}

export const redis: Redis | null =
  process.env.NODE_ENV === "production"
    ? (globalThis.__redis ?? (globalThis.__redis = createClient() ?? undefined) ?? null)
    : (globalThis.__redis ?? (globalThis.__redis = createClient() ?? undefined) ?? null);
