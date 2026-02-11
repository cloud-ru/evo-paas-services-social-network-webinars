import { ApiProperty } from '@nestjs/swagger';

export class LikeMessageResponseDto {
  @ApiProperty({
    example: '770e8400-e29b-41d4-a716-446655440002',
    description: 'ID of the liked message',
  })
  messageId: string;

  @ApiProperty({
    example: 5,
    description: 'Total number of likes on the message',
  })
  likes: number;
}
