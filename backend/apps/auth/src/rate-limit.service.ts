import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from '../../../libs/redis/redis-cache.service';

/**
 * Redis-backed rate limiting service.
 *
 * Replaces the in-memory Map with shared Redis counters so that rate
 * limits are consistent across multiple auth-service replicas.
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly maxAttempts = 5;
  private readonly windowSeconds = 15 * 60; // 15 minutes

  constructor(private readonly cache: RedisCacheService) {}

  /**
   * Check if the given key (email) is rate-limited for login.
   */
  async isRateLimited(key: string): Promise<boolean> {
    try {
      const count = await this.cache.get<number>(
        `ratelimit:login:${key}`,
      );
      if (count !== null && count >= this.maxAttempts) {
        this.logger.warn(
          `Rate limit exceeded for key: ${key} (${count} attempts)`,
        );
        return true;
      }
      return false;
    } catch (err) {
      this.logger.error(`Rate limit check failed for ${key}: ${err}`);
      // On Redis error, allow the request (fail open)
      return false;
    }
  }

  /**
   * Record a failed login attempt and return the new count.
   */
  async recordFailedAttempt(key: string): Promise<void> {
    try {
      const newCount = await this.cache.increment(
        `ratelimit:login:${key}`,
        this.windowSeconds,
      );
      this.logger.log(
        `Failed login attempt recorded for ${key}: ${newCount} attempts`,
      );
    } catch (err) {
      this.logger.error(`Failed to record attempt for ${key}: ${err}`);
    }
  }

  /**
   * Clear failed attempts (called on successful login).
   */
  async clearFailedAttempts(key: string): Promise<void> {
    try {
      await this.cache.delete(`ratelimit:login:${key}`);
      this.logger.log(`Cleared failed login attempts for ${key}`);
    } catch (err) {
      this.logger.error(`Failed to clear attempts for ${key}: ${err}`);
    }
  }

  /**
   * Generic rate limiter for arbitrary actions (e.g. forgot-password).
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    try {
      const nsKey = `ratelimit:${key}`;
      const current = await this.cache.get<number>(nsKey);

      if (current !== null && current >= limit) {
        this.logger.warn(
          `Rate limit exceeded for ${key} (${current}/${limit})`,
        );
        return true;
      }

      await this.cache.increment(nsKey, windowSeconds);
      return false;
    } catch (err) {
      this.logger.error(`Rate limit check failed for ${key}: ${err}`);
      return false; // fail open
    }
  }
}
