import { ApiProperty } from '@nestjs/swagger';

export class RefreshDataDto {
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 900,
  })
  expiresIn: number;
}

export class RefreshErrorDto {
  @ApiProperty({
    description: 'Error code',
    example: 'INVALID_REFRESH_TOKEN',
  })
  code: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Refresh token is invalid or expired',
  })
  message: string;
}

export class RefreshResponseDto {
  @ApiProperty({
    description: 'Indicates if the refresh was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Refresh data',
    type: RefreshDataDto,
    required: false,
  })
  data?: RefreshDataDto;

  @ApiProperty({
    description: 'Error details if refresh failed',
    type: RefreshErrorDto,
    required: false,
  })
  error?: RefreshErrorDto;
}
