import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { GetMessagesDto } from './get-messages.dto';

export class SearchMessagesDto extends GetMessagesDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'Hello',
    required: true,
    minLength: 1,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @Type(() => String)
  query: string;
}
