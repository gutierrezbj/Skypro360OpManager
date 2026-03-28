import Redis from "ioredis";

/**
 * Redis client singleton — sessions + cache.
 * Hot-reload safe para Next.js dev.
 */

const globalForRedis = globalThis as typeof globalThis & {
  redis: Redis | undefined;
};

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6101/0";

export const redis = globalForRedis.redis ?? new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Cache helpers con TTL por defecto.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key);
}
