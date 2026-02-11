import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Request DTO for password reset endpoint
 */
export class ResetPasswordRequestDto {
  @ApiProperty({
    description: 'The password reset token from email',
    example: 'abcd1234efgh5678ijkl9012mnop3456',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description:
      'New password (min 8 chars, uppercase, lowercase, number, special char)',
    example: 'NewSecurePass456!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
    {
      message:
        'Password must contain uppercase, lowercase, number and special character',
    },
  )
  newPassword: string;
}

/**
 * Response DTO for password reset endpoint
 */
export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response data',
    example: {
      message: 'Password reset successfully. You can now login.',
    },
  })
  data: {
    message: string;
  };
}
