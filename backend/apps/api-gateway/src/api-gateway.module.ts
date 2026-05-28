import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { AuthController } from './auth/auth.controller';
import { UserController } from './user/user.controller';
import { EmailController } from './email/email.controller';
import { MessageController } from './message/message.controller';
import { PostController } from './post/post.controller';
import { FileController } from './file/file.controller';
import { ChatGateway } from './chat.gateway';
import { RedisModule } from '../../../libs/redis/redis.module';
import { CacheInterceptor } from '../../../libs/cache/cache.interceptor';

@Module({
  imports: [
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'supersecret',
      }),
    }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_HOST || 'localhost',
          port: 3001,
        },
      },
      {
        name: 'EMAIL_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.EMAIL_HOST || 'localhost',
          port: 3002,
        },
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_HOST || 'localhost',
          port: 3003,
        },
      },
      {
        name: 'MESSAGE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.MESSAGE_HOST || 'localhost',
          port: 3004,
        },
      },
      {
        name: 'POST_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.POST_HOST || 'localhost',
          port: 3005,
        },
      },
      {
        name: 'FILE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.FILE_HOST || 'localhost',
          port: 3006,
        },
      },
    ]),
  ],
  controllers: [
    ApiGatewayController,
    AuthController,
    UserController,
    EmailController,
    MessageController,
    PostController,
    FileController,
  ],
  providers: [
    ApiGatewayService,
    ChatGateway,
    CacheInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: CacheInterceptor,
    },
  ],
})
export class ApiGatewayModule {}
