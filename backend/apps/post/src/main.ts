import { NestFactory } from '@nestjs/core';
import { PostModule } from './post.module';
import { Logger } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('PostMain');
  const app = await NestFactory.create(PostModule);

  // Connect TCP microservice transport
  const tcpPort = Number.parseInt(process.env.PORT || '3005', 10);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.HOST || '0.0.0.0',
      port: tcpPort,
    },
  });

  await app.startAllMicroservices();
  await app.init();
  logger.log(`Post Service microservice listening on TCP port ${tcpPort}`);
}
void bootstrap();
