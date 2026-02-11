import { ApiProperty } from '@nestjs/swagger';

class LastMessageDto {
  @ApiProperty({ example: '770e8400-e29b-41d4-a716-446655440002' })
  id: string;

  @ApiProperty({ example: 'Hi Jane! How are you?' })
  content: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  senderId: string;

  @ApiProperty({ example: '2026-01-21T11:40:00Z' })
  createdAt: Date;
}

export class ConversationPreviewDto {
  @ApiProperty({
    example: '660e8400-e29b-41d4-a716-446655440001',
    description: 'ID of the conversation partner',
  })
  partnerId: string;

  @ApiProperty({ type: LastMessageDto })
  lastMessage: LastMessageDto;

  @ApiProperty({ example: 5, description: 'Number of unread messages' })
  unreadCount: number;
}
