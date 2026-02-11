import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for unread messages count
 */
export class GetUnreadCountResponseDto {
  @ApiProperty({
    description: 'Total count of unread messages across all conversations',
    example: 5,
  })
  unreadCount: number;
}
