import { ApiProperty } from '@nestjs/swagger';
import { MessageResponseDto } from './message-response.dto';

export class SearchMessagesResponseDto {
  @ApiProperty({
    description: 'List of found messages',
    type: [MessageResponseDto],
  })
  messages: MessageResponseDto[];

  @ApiProperty({
    description: 'Total count of found messages',
    example: 10,
  })
  total: number;
}
