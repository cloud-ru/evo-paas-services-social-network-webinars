import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_KEY = 'cache:ttl';
export const CACHE_KEY_KEY = 'cache:key';
export const NO_CACHE_KEY = 'cache:no-cache';

/**
 * Mark an endpoint for response caching.
 *
 * @param ttlSeconds - Cache duration in seconds (default: 60)
 * @param keyPrefix  - Optional static prefix for the cache key.
 *                     The full key is built as `res:{keyPrefix}:{userId}` or
 *                     `res:{keyPrefix}:{userId}:{paramId}` depending on context.
 *
 * Example:
 *   @Cached(300)                    // TTL=300s, default key derivation
 *   @Cached(60, 'user:me')         // TTL=60s, explicit prefix
 */
export const Cached = (ttlSeconds = 60, keyPrefix?: string) =>
  SetMetadata(CACHE_TTL_KEY, { ttl: ttlSeconds, keyPrefix });

/**
 * Explicitly exclude an endpoint from caching, even if a class-level
 * interceptor is present.
 */
export const NoCache = () => SetMetadata(NO_CACHE_KEY, true);

/**
 * Retrieve cache metadata from a handler / class.
 */
export interface CacheMetadata {
  ttl: number;
  keyPrefix?: string;
}

export function getCacheMetadata(target: any): CacheMetadata | null {
  const meta = Reflect.getMetadata(CACHE_TTL_KEY, target);
  if (!meta) return null;
  return meta as CacheMetadata;
}

export function hasNoCache(target: any): boolean {
  return Reflect.getMetadata(NO_CACHE_KEY, target) === true;
}

/**
 * Build a human-readable cache key.
 *
 * Format: `res:{prefix}:{userId}[:{resourceId}]`
 *
 * Extras are pulled from request.params (e.g. `id`, `userId`) and req.user.
 */
export function buildCacheKey(
  prefix: string,
  userId: string,
  resourceId?: string,
): string {
  if (resourceId) {
    return `res:${prefix}:${userId}:${resourceId}`;
  }
  return `res:${prefix}:${userId}`;
}
