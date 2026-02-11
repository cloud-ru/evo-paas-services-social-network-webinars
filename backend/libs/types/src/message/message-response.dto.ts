import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: '770e8400-e29b-41d4-a716-446655440002' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  senderId: string;

  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440001' })
  recipientId: string;

  @ApiProperty({ example: 'Hi Jane! How are you?' })
  content: string;

  @ApiProperty({ example: '2026-01-21T11:40:00Z' })
  createdAt: Date;

  @ApiProperty({ example: 5, required: false })
  likesCount?: number;

  @ApiProperty({ example: true, required: false })
  isLiked?: boolean;
}
