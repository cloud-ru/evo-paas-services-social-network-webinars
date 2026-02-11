import {
  Controller,
  Get,
  Post,
  Delete,
  Inject,
  Logger,
  UseGuards,
  UseInterceptors,
  Body,
  UploadedFiles,
  Req,
  ParseFilePipeBuilder,
  HttpStatus,
  HttpException,
  Query,
  Param,
} from '@nestjs/common';
import { Request } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from '../auth/guards/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  CreatePostDto,
  PostResponseDto,
  UploadFileDto,
  GetPostsDto,
  GetFeedResponseDto,
  UserProfileDto,
  FeedPostResponseDto,
  GetUserProfileResponseDto,
  LikePostResponse,
  GetPostLikesDto,
  GetPostLikesResponseDto,
} from '@app/types';

@ApiTags('Posts')
@Controller('posts')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PostController {
  private readonly logger = new Logger(PostController.name);

  constructor(
    @Inject('POST_SERVICE') private readonly postClient: ClientProxy,
    @Inject('FILE_SERVICE') private readonly fileClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  @Get('health')
  @UseGuards()
  @ApiOperation({ summary: 'Check post service health' })
  @ApiResponse({
    status: 200,
    description: 'Returns service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        service: { type: 'string' },
      },
    },
  })
  async healthCheck(): Promise<{ status: string; service: string }> {
    this.logger.log('Proxying health check to post service');
    const result = await firstValueFrom(
      this.postClient.send<{ status: string; service: string }>(
        'post.health',
        {},
      ),
    );
    return result;
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiOperation({ summary: 'Create a new post' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  async createPost(
    @Body() body: { content: string },
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|gif|pdf|doc|docx)$/,
        })
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024, // 10MB per file
        })
        .build({
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
          fileIsRequired: false,
        }),
    )
    files: Array<Express.Multer.File>,
    @Req() req: Request & { user: { userId: string } },
  ): Promise<PostResponseDto> {
    const userId = req.user.userId;
    this.logger.log(`Creating post for user: ${userId}`);

    try {
      const fileIds: string[] = [];

      // Upload files if present
      if (files && files.length > 0) {
        this.logger.log(`Uploading ${files.length} files for post`);

        // Upload concurrently
        const uploadPromises = files.map((file) => {
          const uploadDto: UploadFileDto = {
            file: file.buffer,
            fileName: file.originalname,
            mimeType: file.mimetype,
            userId,
            folder: 'posts',
          };
          return firstValueFrom(
            this.fileClient.send<string>('file.upload', uploadDto),
          );
        });

        const urls = await Promise.all(uploadPromises);
        fileIds.push(...urls);
      }

      // Create Post
      const createPostDto: CreatePostDto = {
        content: body.content,
        fileUrls: fileIds,
      };

      const result = await firstValueFrom(
        this.postClient.send<PostResponseDto>('post.create', {
          dto: createPostDto,
          userId,
        }),
      );

      return result;
    } catch (error) {
      this.logger.error(`Create post failed: ${JSON.stringify(error)}`);
      const err = error as { message?: string; status?: number };
      throw new HttpException(
        err.message || 'Create post failed',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single post' })
  @ApiResponse({
    status: 200,
    description: 'Returns post with author info',
    type: FeedPostResponseDto,
  })
  async getPost(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string } },
  ): Promise<FeedPostResponseDto> {
    const userId = req.user.userId;
    this.logger.log(`Getting post ${id} for user ${userId}`);

    try {
      const post = await firstValueFrom(
        this.postClient.send<PostResponseDto>('post.get_one', { id, userId }),
      );

      let author: UserProfileDto | undefined;
      try {
        const profile = await firstValueFrom(
          this.userClient.send<GetUserProfileResponseDto>('user.get-profile', {
            userId: post.authorId,
          }),
        );
        author = profile as unknown as UserProfileDto;
      } catch (e) {
        this.logger.warn(`Author not found for post ${id}`, e);
      }

      return {
        ...post,
        author,
      };
    } catch (error) {
      this.logger.error(`Get post failed: ${error}`);
      const err = error as { message?: string; status?: number };
      throw new HttpException(
        err.message || 'Get post failed',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user posts' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated user posts',
    type: GetFeedResponseDto,
  })
  async getUserPosts(
    @Param('userId') authorId: string,
    @Query() query: GetPostsDto,
    @Req() req: Request & { user: { userId: string } },
  ): Promise<GetFeedResponseDto> {
    this.logger.log(`Getting posts for user ${authorId}`);
    const userId = req.user.userId;

    const dto = { ...query, authorId };

    // 1. Get posts from Post Service
    const feed = await firstValueFrom(
      this.postClient.send<GetFeedResponseDto>('post.get_all', {
        dto,
        userId,
      }),
    );

    // 2. Get author profile (we already know the authorId)
    let author: UserProfileDto | undefined;
    try {
      const profile = await firstValueFrom(
        this.userClient.send<GetUserProfileResponseDto>('user.get-profile', {
          userId: authorId,
        }),
      );
      author = profile as unknown as UserProfileDto;
    } catch (e) {
      this.logger.warn(`Author ${authorId} not found`, e);
    }

    const postsWithAuthors = feed.posts.map((post) => ({
      ...post,
      author,
    }));

    return {
      posts: postsWithAuthors,
      total: feed.total,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get posts feed' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated posts with author info',
    type: GetFeedResponseDto,
  })
  async getPosts(
    @Query() query: GetPostsDto,
    @Req() req: Request & { user: { userId: string } },
  ): Promise<GetFeedResponseDto> {
    this.logger.log(`Getting posts feed`);
    const userId = req.user.userId;

    // 1. Get posts from Post Service
    const feed = await firstValueFrom(
      this.postClient.send<GetFeedResponseDto>('post.get_all', {
        dto: query,
        userId,
      }),
    );

    // 2. Extract author IDs
    const authorIds = [...new Set(feed.posts.map((post) => post.authorId))];

    // 3. Get authors from User Service
    const authors = await firstValueFrom(
      this.userClient.send<UserProfileDto[]>('user.get_many', authorIds),
    );

    // 4. Map authors to posts
    const authorMap = new Map(authors.map((a) => [a.userId, a]));

    const postsWithAuthors = feed.posts.map((post) => ({
      ...post,
      author: authorMap.get(post.authorId),
    }));

    return {
      posts: postsWithAuthors,
      total: feed.total,
    };
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like a post' })
  @ApiResponse({
    status: 201,
    description: 'Post liked successfully',
    schema: {
      type: 'object',
      properties: {
        postId: { type: 'string' },
        likes: { type: 'number' },
      },
    },
  })
  async likePost(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string } },
  ): Promise<LikePostResponse> {
    const userId = req.user.userId;
    this.logger.log(`User ${userId} liking post ${id}`);
    const result = await firstValueFrom(
      this.postClient.send<LikePostResponse>('post.like', {
        postId: id,
        userId,
      }),
    );
    return result;
  }

  @Delete(':id/like')
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiResponse({
    status: 200,
    description: 'Post disliked successfully',
    schema: {
      type: 'object',
      properties: {
        postId: { type: 'string' },
        likes: { type: 'number' },
      },
    },
  })
  async dislikePost(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string } },
  ): Promise<LikePostResponse> {
    const userId = req.user.userId;
    this.logger.log(`User ${userId} disliking post ${id}`);
    const result = await firstValueFrom(
      this.postClient.send<LikePostResponse>('post.unlike', {
        postId: id,
        userId,
      }),
    );
    return result;
  }

  @Get(':id/likes')
  @ApiOperation({ summary: 'Get users who liked a post' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of users who liked the post',
    type: GetPostLikesResponseDto,
  })
  async getPostLikes(
    @Param('id') postId: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ): Promise<GetPostLikesResponseDto> {
    this.logger.log(`Getting likes for post ${postId}`);

    const dto: GetPostLikesDto = {
      postId,
      limit: Number(limit) || 10,
      offset: Number(offset) || 0,
    };

    // 1. Get likes from Post Service
    const { likes, total } = await firstValueFrom(
      this.postClient.send<{
        likes: { userId: string; createdAt: Date }[];
        total: number;
      }>('post.get_likes', dto),
    );

    if (!likes || likes.length === 0) {
      return { users: [], total: 0 };
    }

    // 2. Get user profiles
    const userIds = likes.map((like) => like.userId);
    const users = await firstValueFrom(
      this.userClient.send<UserProfileDto[]>('user.get_many', userIds),
    );

    return {
      users,
      total,
    };
  }
}
