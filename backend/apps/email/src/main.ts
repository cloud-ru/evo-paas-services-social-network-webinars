import { NestFactory } from '@nestjs/core';
import { EmailModule } from './email.module';
import { Logger } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('EmailMain');
  const app = await NestFactory.create(EmailModule);

  // Connect TCP microservice transport
  const tcpPort = Number.parseInt(process.env.PORT || '3002', 10);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.HOST || '0.0.0.0',
      port: tcpPort,
    },
  });

  await app.startAllMicroservices();
  
  // Start HTTP server for health endpoint
  const httpPort = Number.parseInt(process.env.HTTP_PORT || '3012', 10);
  await app.listen(httpPort);
  
  logger.log(`Email Service microservice listening on TCP port ${tcpPort}`);
  logger.log(`Email Service HTTP server listening on port ${httpPort}`);
  logger.log(`Health check available at http://localhost:${httpPort}/health`);
}
void bootstrap();
