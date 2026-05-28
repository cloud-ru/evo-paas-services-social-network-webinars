import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { RedisCacheService } from '../../../libs/redis/redis-cache.service';
import { CacheInterceptor } from '../../../libs/cache/cache.interceptor';

@ApiTags('Gateway')
@Controller()
export class ApiGatewayController {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly cacheService: RedisCacheService,
    private readonly cacheInterceptor: CacheInterceptor,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check with Redis diagnostics' })
  @ApiResponse({ status: 200, description: 'Service health + Redis status' })
  async healthCheck() {
    let redisStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    let redisError: string | null = null;
    let redisLatencyMs: number | null = null;

    // Hard timeout so the health check always responds within the K8s probe
    // timeout (1s). A healthy Redis PING completes in <100ms; the 800ms cap
    // is a safety net that prevents retry loops from blocking readiness.
    const REDIS_PING_TIMEOUT_MS = 800;

    try {
      const pingPromise = this.redis.ping();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Redis PING timed out')),
          REDIS_PING_TIMEOUT_MS,
        ),
      );

      const start = Date.now();
      const pong = await Promise.race([pingPromise, timeoutPromise]);
      redisLatencyMs = Date.now() - start;
      redisStatus = pong === 'PONG' ? 'connected' : 'error';
    } catch (err) {
      redisStatus = 'error';
      redisError = (err as Error).message;
    }

    const cacheStats = this.cacheInterceptor.getStats();

    return {
      status: 'ok',
      redis: {
        status: redisStatus,
        latencyMs: redisLatencyMs,
        error: redisError,
      },
      cache: {
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRatio: Math.round(cacheStats.ratio * 100) / 100,
      },
    };
  }
}
