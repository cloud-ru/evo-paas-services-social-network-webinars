import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { stringify } from 'yaml';
import { Request, Response } from 'express';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const logger = new Logger('ApiGateway');
  const app = await NestFactory.create(ApiGatewayModule);

  // Enable CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || '*';
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Social Network API Gateway')
    .setDescription('API Gateway for Social Network Microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const yamlString = stringify(document, {});
  app.getHttpAdapter().get('/api-yaml', (req: Request, res: Response) => {
    res.type('text/yaml');
    res.send(yamlString);
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`API Gateway running on http://localhost:${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api`);
  logger.log(`Swagger YAML available at http://localhost:${port}/api-yaml`);
}
void bootstrap();
