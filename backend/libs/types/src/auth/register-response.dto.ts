import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseData {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ example: 'john@company.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'Verification email sent. Please check your inbox.' })
  message: string;
}

export class RegisterErrorDto {
  @ApiProperty({ example: 'EMAIL_ALREADY_EXISTS' })
  code: string;

  @ApiProperty({ example: 'User with this email already exists' })
  message: string;
}

export class RegisterResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: RegisterResponseData })
  data?: RegisterResponseData;

  @ApiProperty({ type: RegisterErrorDto, required: false })
  error?: RegisterErrorDto;
}
