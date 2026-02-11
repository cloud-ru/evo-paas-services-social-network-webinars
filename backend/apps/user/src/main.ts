import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { Logger } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('UserMain');
  const app = await NestFactory.create(UserModule);

  // Connect TCP microservice transport
  const tcpPort = Number.parseInt(process.env.PORT || '3003', 10);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.HOST || '0.0.0.0',
      port: tcpPort,
    },
  });

  await app.startAllMicroservices();
  await app.init();
  logger.log(`User Service microservice listening on TCP port ${tcpPort}`);
}
void bootstrap();
