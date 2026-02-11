import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../user/user-profile.dto';

export class PostLikeDto {
  @ApiProperty({ description: 'User ID of the liker' })
  userId: string;

  @ApiProperty({ description: 'Date when the post was liked' })
  createdAt: Date;
}

export class PostServiceLikesResponseDto {
  @ApiProperty({ type: [PostLikeDto], description: 'List of likes' })
  likes: PostLikeDto[];

  @ApiProperty({ description: 'Total number of likes' })
  total: number;
}

export class GetPostLikesResponseDto {
  @ApiProperty({
    type: [UserProfileDto],
    description: 'List of users who liked the post',
  })
  users: UserProfileDto[];

  @ApiProperty({ description: 'Total number of likes' })
  total: number;
}
