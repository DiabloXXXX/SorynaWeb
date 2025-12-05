import Redis from 'ioredis';

// Singleton Redis client
let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }
    
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }
  
  return redis;
}

// Helper functions to match Vercel KV API
export const kv = {
  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    const client = getRedisClient();
    return client.sadd(key, ...members);
  },
  
  async smembers(key: string): Promise<string[]> {
    const client = getRedisClient();
    return client.smembers(key);
  },
  
  async srem(key: string, ...members: string[]): Promise<number> {
    const client = getRedisClient();
    return client.srem(key, ...members);
  },

  async sismember(key: string, member: string): Promise<number> {
    const client = getRedisClient();
    return client.sismember(key, member);
  },
  
  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    const client = getRedisClient();
    return client.lpush(key, ...values);
  },
  
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const client = getRedisClient();
    return client.lrange(key, start, stop);
  },
  
  async lrem(key: string, count: number, value: string): Promise<number> {
    const client = getRedisClient();
    return client.lrem(key, count, value);
  },
  
  async llen(key: string): Promise<number> {
    const client = getRedisClient();
    return client.llen(key);
  },
  
  // Hash operations
  async hset(key: string, data: Record<string, unknown>): Promise<number> {
    const client = getRedisClient();
    const flatData: string[] = [];
    for (const [field, value] of Object.entries(data)) {
      flatData.push(field, JSON.stringify(value));
    }
    return client.hset(key, ...flatData);
  },
  
  async hgetall<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    const data = await client.hgetall(key);
    
    if (!data || Object.keys(data).length === 0) {
      return null;
    }
    
    // Parse JSON values back
    const result: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(data)) {
      try {
        result[field] = JSON.parse(value);
      } catch {
        result[field] = value;
      }
    }
    
    return result as T;
  },
  
  // Key operations
  async del(...keys: string[]): Promise<number> {
    const client = getRedisClient();
    return client.del(...keys);
  },
  
  async exists(...keys: string[]): Promise<number> {
    const client = getRedisClient();
    return client.exists(...keys);
  },
  
  // String operations (for simple key-value)
  async set(key: string, value: string | number): Promise<'OK' | null> {
    const client = getRedisClient();
    return client.set(key, String(value));
  },
  
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    return client.get(key);
  },
};

export default kv;
