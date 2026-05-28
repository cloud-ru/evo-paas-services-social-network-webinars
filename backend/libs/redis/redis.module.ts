import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisCacheService } from './redis-cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);
        const username = configService.get<string>('REDIS_USER', '');
        const password = configService.get<string>('REDIS_PASSWORD', '');

        const redis = new Redis({
          host,
          port,
          username: username || undefined,
          password: password || undefined,
          retryStrategy(times) {
            const delay = Math.min(times * 200, 3000);
            console.warn(
              `[Redis] Reconnection attempt ${times}, retrying in ${delay}ms`,
            );
            return delay;
          },
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          // Managed Redis often restricts the INFO command for non-admin
          // users. Disable the built-in ready check to avoid spurious
          // NOPERM warnings; we rely on the PING-based health endpoint instead.
          enableReadyCheck: false,
        });

        redis.on('connect', () => {
          console.log(`[Redis] Connected to ${host}:${port}`);
        });

        redis.on('error', (err) => {
          console.error(`[Redis] Error: ${err.message}`);
        });

        // Initiate connection in background — does not block app startup.
        // retryStrategy handles automatic reconnection on failure.
        redis.connect().catch((err) => {
          console.warn(
            `[Redis] Initial connection to ${host}:${port} failed: ${err.message}. ` +
            `Background reconnection will continue.`,
          );
        });

        return redis;
      },
    },
    RedisCacheService,
  ],
  exports: ['REDIS_CLIENT', RedisCacheService],
})
export class RedisModule {}
