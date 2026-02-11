import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordRequestDto {
  @ApiProperty({
    example: 'john@company.com',
    description: 'Email address of the user requesting password reset',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example: 'If an account exists, a password reset email will be sent',
    description: 'Status message',
  })
  message: string;
}
