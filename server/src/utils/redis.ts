import Redis from 'ioredis';
import { env } from '../config/env';

let redisClient: Redis | null = null;
let redisAvailable = false;

// Memory lock fallback store when Redis is offline or in test
const memoryLockMap = new Map<string, number>();

// In test env, skip Redis entirely to avoid open handles
if (env.NODE_ENV !== 'test') {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: false,
      connectTimeout: 2000,
      enableAutoPipelining: false,
      retryStrategy: (times) => {
        if (times > 2) return null; // Stop retrying after 2 attempts
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on('connect', () => {
      redisAvailable = true;
      console.log('[Redis] Connected successfully');
    });

    redisClient.on('error', () => {
      redisAvailable = false;
    });
  } catch {
    redisAvailable = false;
  }
}

/**
 * Acquire a distributed lock for key with TTL (in ms)
 */
export async function acquireLock(key: string, ttlMs: number = 5000): Promise<boolean> {
  if (redisAvailable && redisClient) {
    try {
      const result = await redisClient.set(key, 'LOCKED', 'PX', ttlMs, 'NX');
      return result === 'OK';
    } catch {
      redisAvailable = false;
    }
  }

  // Fallback in-memory locking (used in tests and when Redis is offline)
  const now = Date.now();
  const expires = memoryLockMap.get(key);
  if (expires && expires > now) {
    return false; // Lock taken
  }
  memoryLockMap.set(key, now + ttlMs);
  return true;
}

/**
 * Release lock for key
 */
export async function releaseLock(key: string): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch {
      // Fallback
    }
  }
  memoryLockMap.delete(key);
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit().catch(() => {});
    redisClient = null;
    redisAvailable = false;
  }
}
