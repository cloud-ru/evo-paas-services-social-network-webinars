import { ApiProperty } from '@nestjs/swagger';
import { ConversationPreviewDto } from './conversation-preview.dto';

export class GetConversationsResponseDto {
  @ApiProperty({ type: [ConversationPreviewDto] })
  conversations: ConversationPreviewDto[];

  @ApiProperty({ example: 15, description: 'Total number of conversations' })
  total: number;
}
