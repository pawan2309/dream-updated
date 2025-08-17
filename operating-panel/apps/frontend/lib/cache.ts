import Redis from 'ioredis';

class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  async publish(channel: string, message: any): Promise<void> {
    try {
      await this.redis.publish(channel, JSON.stringify(message));
    } catch (error) {
      console.error('Cache publish error:', error);
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      const subscriber = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      });

      await subscriber.subscribe(channel);
      subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          callback(JSON.parse(message));
        }
      });
    } catch (error) {
      console.error('Cache subscribe error:', error);
    }
  }
}

export const cacheService = new CacheService(); 