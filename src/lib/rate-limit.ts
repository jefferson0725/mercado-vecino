import { redis } from "./redis";

// Sliding window con Redis (sorted set por clave+ventana). Lua script atómico:
// elimina entradas viejas, inserta si hay cupo y renueva el TTL. Devuelve 1/0.
const SLIDING_WINDOW_SCRIPT = `
local key     = KEYS[1]
local now     = tonumber(ARGV[1])
local window  = tonumber(ARGV[2])
local limit   = tonumber(ARGV[3])
local id      = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
local count = tonumber(redis.call('ZCARD', key))
if count < limit then
  redis.call('ZADD', key, now, id)
  redis.call('PEXPIRE', key, window)
  return 1
end
return 0
`;

async function rateLimitRedis(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
  now: number
): Promise<boolean> {
  if (!redis) return true;
  try {
    const result = await redis.eval(
      SLIDING_WINDOW_SCRIPT,
      1,
      `rl:${key}`,
      String(now),
      String(windowMs),
      String(limit),
      `${now}-${Math.random()}`
    );
    return result === 1;
  } catch {
    return true; // si Redis falla, no bloqueamos al usuario
  }
}

// Fallback en memoria para desarrollo o cuando Redis está caído. Fixed window,
// suficiente para un solo proceso.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function rateLimitMemory(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
  now: number
): boolean {
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export async function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
  now = Date.now()
): Promise<boolean> {
  if (redis) return rateLimitRedis(key, opts, now);
  return rateLimitMemory(key, opts, now);
}
