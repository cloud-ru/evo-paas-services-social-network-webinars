import { ApiProperty } from '@nestjs/swagger';

export class AvatarUploadResponseDto {
  @ApiProperty({ description: 'The URL of the uploaded avatar' })
  avatarUrl: string;

  @ApiProperty({ description: 'Success message' })
  message: string;
}

export class UploadFileDto {
  file: Buffer;
  fileName: string;
  mimeType: string;
  userId: string;
  folder?: string;
}
