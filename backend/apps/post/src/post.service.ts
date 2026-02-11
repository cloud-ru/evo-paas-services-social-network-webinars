import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  CreatePostDto,
  PostResponseDto,
  GetPostsDto,
  GetFeedResponseDto,
  UserProfileDto,
  GetPostLikesDto,
  SignedUrlsResponseDto,
} from '@app/types';
import { PostRepository } from './post/post.repository';
import { PostGateway } from './post.gateway';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private readonly postRepository: PostRepository,
    private readonly postGateway: PostGateway,
    @Inject('FILE_SERVICE') private readonly fileClient: ClientProxy,
  ) {}

  async createPost(
    data: CreatePostDto,
    authorId: string,
  ): Promise<PostResponseDto> {
    this.logger.log(`Creating post for user ${authorId}`);

    if (data.fileUrls && data.fileUrls.length > 1) {
      throw new RpcException({
        statusCode: 400,
        message: 'Only one file is allowed per post',
      });
    }

    // Create post in DB
    const post = await this.postRepository.create(data, authorId);

    const signedUrls = await this.signUrls(post.files.map((f) => f.url));

    // Map to response DTO
    const postResponse: PostResponseDto = {
      id: post.id,
      content: post.content,
      authorId: post.authorId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likesCount: 0,
      isLiked: false,
      files: post.files.map((f) => ({
        id: f.id,
        url: signedUrls[f.url] || f.url,
      })),
    };

    // Broadcast
    this.postGateway.broadcastPost(postResponse);

    return postResponse;
  }

  async getPosts(
    dto: GetPostsDto,
    userId: string,
  ): Promise<GetFeedResponseDto> {
    const { limit = 10, offset = 0, authorId } = dto;
    this.logger.log(
      `Getting posts limit=${limit} offset=${offset} author=${authorId}`,
    );

    const [posts, total] = await this.postRepository.findAll(
      limit,
      offset,
      userId,
      authorId,
    );

    const allFileUrls = posts.flatMap((p) => p.files.map((f) => f.url));
    const signedUrls = await this.signUrls(allFileUrls);

    return {
      posts: posts.map((post) => ({
        id: post.id,
        content: post.content,
        authorId: post.authorId,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        likesCount: post.likesCount || 0,
        isLiked: post.likes.length > 0,
        files: post.files.map((f) => ({
          id: f.id,
          url: signedUrls[f.url] || f.url,
        })),
        author: undefined as unknown as UserProfileDto, // Will be filled by API Gateway
      })),
      total,
    };
  }

  async getPost(id: string, userId: string): Promise<PostResponseDto> {
    const post = await this.postRepository.findById(id, userId);

    if (!post) {
      throw new RpcException({
        message: 'Post not found',
        status: 404,
      });
    }

    const signedUrls = await this.signUrls(post.files.map((f) => f.url));

    return {
      id: post.id,
      content: post.content,
      authorId: post.authorId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likesCount: post.likesCount || 0,
      isLiked: post.likes.length > 0,
      files: post.files.map((f) => ({
        id: f.id,
        url: signedUrls[f.url] || f.url,
      })),
    };
  }

  async likePost(postId: string, userId: string): Promise<number> {
    this.logger.log(`User ${userId} liking post ${postId}`);
    return this.postRepository.like(postId, userId);
  }

  async unlikePost(postId: string, userId: string): Promise<number> {
    this.logger.log(`User ${userId} unliking post ${postId}`);
    return this.postRepository.unlike(postId, userId);
  }

  async getPostLikes(dto: GetPostLikesDto) {
    const { postId, limit = 10, offset = 0 } = dto;
    this.logger.log(`Getting likes for post ${postId}`);
    const [likes, total] = await this.postRepository.findLikes(
      postId,
      limit,
      offset,
    );
    return { likes, total };
  }

  private async signUrls(urls: string[]): Promise<Record<string, string>> {
    if (urls.length === 0) return {};
    try {
      const { urls: signedUrls } = await firstValueFrom(
        this.fileClient.send<SignedUrlsResponseDto>('file.get_signed_urls', {
          urls,
        }),
      );
      return signedUrls;
    } catch (e) {
      this.logger.error('Failed to sign urls', e);
      return urls.reduce((acc, url) => ({ ...acc, [url]: url }), {});
    }
  }
}
