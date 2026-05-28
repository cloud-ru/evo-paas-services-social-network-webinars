import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Typed wrapper around Redis for cache get/set/del/invalidation operations.
 * Used by both the CacheInterceptor (response caching) and the auth service
 * (session token storage / rate limiting).
 */
@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /**
   * Retrieve a cached JSON value by key.
   * Returns `null` on miss or parse failure.
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (raw === null) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`[RedisCacheService] GET ${key} failed: ${err}`);
      return null;
    }
  }

  /**
   * Store a value in Redis with an optional TTL (seconds).
   * The value is JSON‑serialised.
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialised = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.redis.setex(key, ttlSeconds, serialised);
      } else {
        await this.redis.set(key, serialised);
      }
    } catch (err) {
      this.logger.warn(`[RedisCacheService] SET ${key} failed: ${err}`);
    }
  }

  /**
   * Delete one or more keys from Redis.
   */
  async delete(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      await this.redis.del(...keys);
    } catch (err) {
      this.logger.warn(
        `[RedisCacheService] DEL ${keys.join(', ')} failed: ${err}`,
      );
    }
  }

  /**
   * Check whether a key exists in Redis.
   */
  async exists(key: string): Promise<boolean> {
    try {
      const count = await this.redis.exists(key);
      return count === 1;
    } catch {
      return false;
    }
  }

  /**
   * Atomically increment a counter and set TTL on first creation.
   * Returns the new counter value.
   */
  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const value = await this.redis.incr(key);
      if (value === 1 && ttlSeconds && ttlSeconds > 0) {
        await this.redis.expire(key, ttlSeconds);
      }
      return value;
    } catch (err) {
      this.logger.warn(`[RedisCacheService] INCR ${key} failed: ${err}`);
      return 0;
    }
  }

  /**
   * Get the raw Redis client for advanced operations (e.g. pipelines).
   */
  getClient(): Redis {
    return this.redis;
  }
}
