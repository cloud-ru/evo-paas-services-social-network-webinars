import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FileService } from './file.service';
import { UploadFileDto } from '@app/types';

@Controller()
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(private readonly fileService: FileService) {}

  @MessagePattern('file.health')
  healthCheck() {
    this.logger.log('Received health check request');
    return { status: 'ok', service: 'file' };
  }

  @MessagePattern('file.upload_avatar')
  async uploadAvatar(@Payload() uploadDto: UploadFileDto) {
    this.logger.log(`Uploading avatar for user ${uploadDto.userId}`);
    return this.fileService.uploadFile(uploadDto);
  }

  @MessagePattern('file.upload')
  async uploadFile(@Payload() uploadDto: UploadFileDto) {
    this.logger.log(
      `Uploading file for user ${uploadDto.userId} to ${uploadDto.folder || 'default'}`,
    );
    return this.fileService.uploadFile(uploadDto);
  }

  @MessagePattern('file.get_signed_url')
  async getSignedUrl(@Payload() payload: { url: string }) {
    return { url: await this.fileService.getSignedUrl(payload.url) };
  }

  @MessagePattern('file.get_signed_urls')
  async getSignedUrls(@Payload() payload: { urls: string[] }) {
    return { urls: await this.fileService.getSignedUrls(payload.urls) };
  }
}
