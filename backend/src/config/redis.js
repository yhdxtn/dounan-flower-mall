import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 1
});

let connected = false;

export async function getCache(key) {
  try {
    if (!connected) {
      await redis.connect();
      connected = true;
    }
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function setCache(key, value, seconds = 60) {
  try {
    if (!connected) {
      await redis.connect();
      connected = true;
    }
    await redis.set(key, JSON.stringify(value), 'EX', seconds);
  } catch {
    // Redis is a cache only; API should still work when it is down locally.
  }
}

export async function delCache(...keys) {
  try {
    if (!connected) {
      await redis.connect();
      connected = true;
    }
    if (keys.length) await redis.del(keys);
  } catch {
    // ignore cache invalidation failures
  }
}

export async function delCacheByPattern(pattern) {
  try {
    if (!connected) {
      await redis.connect();
      connected = true;
    }
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(keys);
  } catch {
    // ignore cache invalidation failures
  }
}
