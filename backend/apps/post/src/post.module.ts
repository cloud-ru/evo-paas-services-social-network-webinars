import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PrismaService } from './prisma.service';
import { PostRepository } from './post/post.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostGateway } from './post.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ClientsModule.registerAsync([
      {
        name: 'FILE_SERVICE',

        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('FILE_HOST', 'localhost'),
            port: 3006,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [PostController],
  providers: [PostService, PrismaService, PostRepository, PostGateway],
})
export class PostModule {}
