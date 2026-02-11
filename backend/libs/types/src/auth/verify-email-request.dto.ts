import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for email verification request
 */
export class VerifyEmailRequestDto {
  @ApiProperty({
    description: 'Email verification token sent to user email',
    example: 'abcd1234efgh5678ijkl9012mnop3456',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
