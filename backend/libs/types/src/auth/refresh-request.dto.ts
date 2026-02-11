import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshRequestDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'opaque-refresh-token-string',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
