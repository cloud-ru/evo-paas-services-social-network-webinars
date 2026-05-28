import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';

export interface TokenMetadata {
  userId: string;
  sessionId: string;
  expiresAt: number; // unix timestamp (seconds)
  revoked: boolean;
}

/**
 * Redis-backed store for access-token metadata.
 *
 * Used by the auth service to avoid hitting PostgreSQL on every token
 * validation. PostgreSQL remains the source of truth; Redis is a cache.
 *
 * Key pattern: `session:token:{accessToken}`
 * TTL: matches JWT expiration (default 900s / 15m)
 */
@Injectable()
export class RedisTokenStore {
  private readonly logger = new Logger(RedisTokenStore.name);

  constructor(private readonly cache: RedisCacheService) {}

  /**
   * Store token metadata in Redis after a successful login or refresh.
   */
  async setToken(
    accessToken: string,
    metadata: TokenMetadata,
    ttlSeconds: number,
  ): Promise<void> {
    const key = `session:token:${accessToken}`;
    this.logger.debug(
      `[RedisTokenStore] SET ${key} (userId=${metadata.userId}, TTL=${ttlSeconds}s)`,
    );
    await this.cache.set(key, metadata, ttlSeconds);
  }

  /**
   * Look up token metadata from Redis.
   * Returns `null` if not found or on error (caller must fall back to DB).
   */
  async getToken(accessToken: string): Promise<TokenMetadata | null> {
    const key = `session:token:${accessToken}`;
    try {
      const meta = await this.cache.get<TokenMetadata>(key);
      if (meta) {
        this.logger.debug(`[RedisTokenStore] HIT  ${key}`);
      } else {
        this.logger.debug(`[RedisTokenStore] MISS ${key}`);
      }
      return meta;
    } catch (err) {
      this.logger.warn(`[RedisTokenStore] Error reading ${key}: ${err}`);
      return null;
    }
  }

  /**
   * Revoke a token in Redis (delete the key).
   */
  async revokeToken(accessToken: string): Promise<void> {
    const key = `session:token:${accessToken}`;
    this.logger.debug(`[RedisTokenStore] DEL ${key}`);
    await this.cache.delete(key);
  }

  /**
   * Invalidate all cached token keys matching a pattern.
   * Used when revoking all sessions (e.g., password reset).
   */
  async revokeAllForUser(userId: string): Promise<void> {
    this.logger.log(`[RedisTokenStore] Revoking all tokens for user ${userId}`);
    // We don't know all access tokens — use SCAN to find them.
    const client = this.cache.getClient();
    const pattern = `session:token:*`;
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, found] = await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;
      for (const key of found) {
        try {
          const meta = await this.cache.get<TokenMetadata>(key);
          if (meta?.userId === userId) {
            keys.push(key);
          }
        } catch {
          // skip unparseable keys
        }
      }
    } while (cursor !== '0');

    if (keys.length > 0) {
      await this.cache.delete(...keys);
      this.logger.log(
        `[RedisTokenStore] Revoked ${keys.length} token(s) for user ${userId}`,
      );
    }
  }
}
