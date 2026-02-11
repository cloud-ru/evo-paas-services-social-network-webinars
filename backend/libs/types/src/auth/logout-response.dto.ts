import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDataDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}

export class LogoutResponseErrorDto {
  @ApiProperty({ example: 'TOKEN_INVALID' })
  code: string;

  @ApiProperty({ example: 'Token is already blacklisted or invalid' })
  message: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: LogoutResponseDataDto, required: false })
  data?: LogoutResponseDataDto;

  @ApiProperty({ type: LogoutResponseErrorDto, required: false })
  error?: LogoutResponseErrorDto;
}
