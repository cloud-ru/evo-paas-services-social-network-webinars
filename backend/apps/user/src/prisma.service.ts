import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@app/prisma-user';
import { createExtendedClient } from './prisma.extension';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public readonly client: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    const primaryUrl =
      this.configService.getOrThrow<string>('USER_DATABASE_URL');
    const replicaUrlsStr = this.configService.get<string>(
      'USER_DATABASE_REPLICA_URLS',
      '',
    );
    const replicaUrls = replicaUrlsStr
      ? replicaUrlsStr.split(',').map((url) => url.trim())
      : [];

    this.client = createExtendedClient(
      primaryUrl,
      replicaUrls,
    ) as unknown as PrismaClient;
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Running Prisma migrations...');
      execSync(
        'npx prisma migrate deploy --schema apps/user/prisma/schema.prisma',
        {
          stdio: 'inherit',
        },
      );
      this.logger.log('Migrations completed successfully');
    } catch (error) {
      this.logger.error('Migration failed', error);
      throw error;
    }

    // Connect to the primary and all replicas
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
