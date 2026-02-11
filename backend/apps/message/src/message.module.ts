import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { PrismaService } from './prisma.service';
import { MessageRepository } from './message.repository';
import { MessageLikeRepository } from './message-like.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_HOST || 'localhost',
          port: 3003,
        },
      },
    ]),
  ],
  controllers: [MessageController],
  providers: [
    MessageService,
    PrismaService,
    MessageRepository,
    MessageLikeRepository,
  ],
})
export class MessageModule {}
