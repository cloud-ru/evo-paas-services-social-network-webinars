import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  Length,
  ArrayMaxSize,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: 'Post content',
    minLength: 1,
    maxLength: 2000,
    example: 'Hello world!',
  })
  @IsString()
  @Length(1, 2000)
  content: string;

  @ApiProperty({
    description: 'Array of file IDs (max 1)',
    required: false,
    maxItems: 1,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(1)
  fileUrls?: string[];
}
