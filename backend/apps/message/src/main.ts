import { NestFactory } from '@nestjs/core';
import { MessageModule } from './message.module';
import { Logger } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('MessageMain');
  const app = await NestFactory.create(MessageModule);

  // Connect TCP microservice transport
  const tcpPort = Number.parseInt(process.env.PORT || '3004', 10);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.HOST || '0.0.0.0',
      port: tcpPort,
    },
  });

  await app.startAllMicroservices();
  
  // Start HTTP server for health endpoint
  const httpPort = Number.parseInt(process.env.HTTP_PORT || '3014', 10);
  await app.listen(httpPort);
  
  logger.log(`Message Service microservice listening on TCP port ${tcpPort}`);
  logger.log(`Message Service HTTP server listening on port ${httpPort}`);
  logger.log(`Health check available at http://localhost:${httpPort}/health`);
}
void bootstrap();
