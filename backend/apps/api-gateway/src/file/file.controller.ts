import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';

@ApiTags('File')
@Controller('file')
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(
    @Inject('FILE_SERVICE') private readonly fileClient: ClientProxy,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check file service health' })
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
    this.logger.log('Proxying health check to file service');
    const result = await firstValueFrom(
      this.fileClient.send<{ status: string; service: string }>(
        'file.health',
        {},
      ),
    );
    return result;
  }
}
