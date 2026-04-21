import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@app/prisma-auth';
import { createExtendedClient } from './prisma.extension';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public readonly client: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    const primaryUrl =
      this.configService.getOrThrow<string>('AUTH_DATABASE_URL');
    const replicaUrlsStr = this.configService.get<string>(
      'AUTH_DATABASE_REPLICA_URLS',
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
    // Connect to the primary and all replicas
    // We cast to PrismaClient only for $connect to satisfy the linter
    // without erasing the extended client's specific model types
    const baseClient = this.client as unknown as PrismaClient;
    await baseClient.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    const baseClient = this.client as unknown as PrismaClient;
    await baseClient.$disconnect();
  }
}
