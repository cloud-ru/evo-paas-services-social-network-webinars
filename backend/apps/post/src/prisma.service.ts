import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@app/prisma-post';
import { execSync } from 'node:child_process';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      this.logger.log('Running Prisma migrations...');
      execSync(
        'npx prisma migrate deploy --schema apps/post/prisma/schema.prisma',
        {
          stdio: 'inherit',
        },
      );
      this.logger.log('Migrations completed successfully');
    } catch (error) {
      this.logger.error('Migration failed', error);
      throw error;
    }

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
