import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisCacheService } from '../redis/redis-cache.service';
import {
  CACHE_TTL_KEY,
  NO_CACHE_KEY,
  CacheMetadata,
  buildCacheKey,
} from './cache.decorator';
import {
  INVALIDATE_CACHE_KEY,
  interpolateCacheKey,
} from './invalidate-cache.decorator';

/**
 * NestJS interceptor that caches HTTP responses in Redis.
 *
 * Behaviour:
 *  1. If the handler is decorated with @Cached(ttl) – read from Redis first;
 *     on cache MISS, execute the handler and store the response.
 *  2. If the handler is decorated with @InvalidateCache(keys) – delete those
 *     keys *after* a successful response.
 *  3. If the handler has @NoCache() – skip entirely.
 *
 * Cache key convention: `res:{prefix}:{userId}[:{resourceId}]`
 *
 * Registered globally in ApiGatewayModule via APP_INTERCEPTOR.
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  /** Counters for /cache/stats (in-memory, approximate) */
  private hits = 0;
  private misses = 0;

  constructor(
    private readonly reflector: Reflector,
    @Inject(RedisCacheService) private readonly cache: RedisCacheService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const handler = context.getHandler();
    const request = context.switchToHttp().getRequest<Request>();

    // ── Skip if @NoCache() ────────────────────────────────────────
    const noCache = this.reflector.get<boolean>(NO_CACHE_KEY, handler);
    if (noCache) {
      return next.handle();
    }

    // ── Cache invalidation (post-response) ────────────────────────
    const invalidateKeys =
      this.reflector.get<string[]>(INVALIDATE_CACHE_KEY, handler) ?? [];

    if (invalidateKeys.length > 0) {
      return next.handle().pipe(
        tap(async () => {
          const userId = (request as any).user?.userId;
          const params = request.params as Record<string, string>;
          const keysToDelete = invalidateKeys.map((k) =>
            interpolateCacheKey(k, params, userId ?? ''),
          );
          this.logger.log(
            `[CacheInvalidate] Deleting keys: ${keysToDelete.join(', ')}`,
          );
          await this.cache.delete(...keysToDelete);
        }),
      );
    }

    // ── Cache read path ───────────────────────────────────────────
    const meta: CacheMetadata | undefined =
      this.reflector.get<CacheMetadata>(CACHE_TTL_KEY, handler);

    if (!meta) {
      return next.handle();
    }

    const userId = (request as any).user?.userId;
    if (!userId) {
      this.logger.debug(
        '[CacheInterceptor] No userId on request, skipping cache',
      );
      return next.handle();
    }

    // Derive resource ID from known route params (coerce to string)
    const params = request.params as Record<string, string>;
    const resourceId =
      params['id'] ??
      params['postId'] ??
      params['messageId'] ??
      params['sessionId'] ??
      params['userId'];

    const prefix = meta.keyPrefix ?? this.inferPrefix(request);
    const cacheKey = buildCacheKey(prefix, userId, resourceId);

    // Try cache read
    try {
      const cached = await this.cache.get(cacheKey);
      if (cached !== null) {
        this.hits++;
        this.logger.debug(`[CacheInterceptor] HIT  ${cacheKey}`);
        return of(cached);
      }
    } catch (err) {
      this.logger.warn(`[CacheInterceptor] Redis read error: ${err}`);
    }

    this.misses++;
    this.logger.debug(`[CacheInterceptor] MISS ${cacheKey}`);

    // Execute handler & cache the response
    return next.handle().pipe(
      tap(async (response) => {
        if (response !== undefined && response !== null) {
          try {
            await this.cache.set(cacheKey, response, meta.ttl);
            this.logger.debug(
              `[CacheInterceptor] SET  ${cacheKey} (TTL ${meta.ttl}s)`,
            );
          } catch (err) {
            this.logger.warn(`[CacheInterceptor] Redis write error: ${err}`);
          }
        }
      }),
    );
  }

  /** Derive a human-readable prefix from the URL path. */
  private inferPrefix(request: Request): string {
    const path = request.route?.path ?? request.path;
    if (path.includes('posts')) return 'post';
    if (path.includes('users')) return 'user';
    if (path.includes('message')) return 'msg';
    if (path.includes('auth')) return 'auth';
    return 'misc';
  }

  /** Simple cache statistics (non-persistent). */
  getStats(): { hits: number; misses: number; ratio: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      ratio: total > 0 ? this.hits / total : 0,
    };
  }
}
