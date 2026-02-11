import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for user login request
 */
export class LoginRequestDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john@company.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({
    description: 'Device name for session tracking',
    example: 'Chrome on Windows',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceName?: string;
}
