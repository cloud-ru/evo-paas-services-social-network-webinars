import { ApiProperty } from '@nestjs/swagger';

/**
 * Login data object
 */
export class LoginDataDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Opaque refresh token',
    example: 'opaque-refresh-token-string-random',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'User ID',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;

  @ApiProperty({
    description: 'User email',
    example: 'john@company.com',
  })
  email: string;
}

/**
 * Login error object
 */
export class LoginErrorDto {
  @ApiProperty({
    description: 'Error code',
    example: 'INVALID_CREDENTIALS',
  })
  code: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Email or password incorrect',
  })
  message: string;
}

/**
 * DTO for login response
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Indicates if the login was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Login data',
    type: LoginDataDto,
    required: false,
  })
  data?: LoginDataDto;

  @ApiProperty({
    description: 'Error details if login failed',
    type: LoginErrorDto,
    required: false,
  })
  error?: LoginErrorDto;
}
