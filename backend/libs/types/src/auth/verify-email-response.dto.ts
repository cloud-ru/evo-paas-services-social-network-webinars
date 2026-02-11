import { ApiProperty } from '@nestjs/swagger';

/**
 * Email verification response data
 */
export class VerifyEmailDataDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Email verified successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Verified email address',
    example: 'john@company.com',
  })
  email: string;

  @ApiProperty({
    description: 'Whether user can now login',
    example: true,
  })
  canLogin: boolean;
}

export class VerifyEmailErrorDto {
  @ApiProperty({ example: 'TOKEN_INVALID' })
  code: string;

  @ApiProperty({ example: 'Verification token is invalid or expired' })
  message: string;
}

/**
 * DTO for email verification response
 */
export class VerifyEmailResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Verification data',
    type: VerifyEmailDataDto,
    required: false,
  })
  data?: VerifyEmailDataDto;

  @ApiProperty({
    description: 'Error details if operation failed',
    type: VerifyEmailErrorDto,
    required: false,
  })
  error?: VerifyEmailErrorDto;
}
