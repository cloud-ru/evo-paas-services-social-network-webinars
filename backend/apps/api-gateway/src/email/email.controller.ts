import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check email service health' })
  @ApiResponse({
    status: 200,
    description: 'Returns service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        service: { type: 'string' },
      },
    },
  })
  async healthCheck(): Promise<{ status: string; service: string }> {
    this.logger.log('Proxying health check to email service');
    const result = await firstValueFrom(
      this.emailClient.send<{ status: string; service: string }>(
        'email.health',
        {},
      ),
    );
    return result;
  }
}
