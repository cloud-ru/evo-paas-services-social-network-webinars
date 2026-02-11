import { ApiProperty } from '@nestjs/swagger';

export class DeleteMessageResponseDto {
  @ApiProperty({
    description: 'Whether the deletion was successful',
    example: true,
  })
  success: boolean;
}
