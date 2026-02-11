import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../user/user-profile.dto';

export class PostFileDto {
  @ApiProperty({ description: 'File ID' })
  id: string;

  @ApiProperty({ description: 'File URL' })
  url: string;
}

export class PostResponseDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Post content' })
  content: string;

  @ApiProperty({ description: 'Author ID' })
  authorId: string;

  @ApiProperty({ description: 'Number of likes' })
  likesCount: number;

  @ApiProperty({ description: 'Is liked by current user' })
  isLiked: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Update date' })
  updatedAt: Date;

  @ApiProperty({ type: [PostFileDto], description: 'Attached files' })
  files: PostFileDto[];
}

export class FeedPostResponseDto extends PostResponseDto {
  @ApiProperty({ type: UserProfileDto, required: false })
  author?: UserProfileDto;
}

export class GetFeedResponseDto {
  @ApiProperty({ type: [FeedPostResponseDto], description: 'List of posts' })
  posts: FeedPostResponseDto[];

  @ApiProperty({ description: 'Total number of posts' })
  total: number;
}
