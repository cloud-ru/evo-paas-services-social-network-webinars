import { UserProfileDto } from "./user";

export interface PostFileDto {
  id: string;
  url: string;
}

export interface PostResponseDto {
  id: string;
  content: string;
  authorId: string;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  files: PostFileDto[];
  isLiked: boolean;
}

export interface FeedPostResponseDto extends PostResponseDto {
  author: UserProfileDto;
}

export interface GetFeedResponseDto {
  posts: FeedPostResponseDto[];
  total: number;
}

export interface GetPostLikesResponseDto {
  users: UserProfileDto[];
  total: number;
}
