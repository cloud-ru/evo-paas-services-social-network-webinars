import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PostService } from './post.service';
import { CreatePostDto, GetPostsDto, GetPostLikesDto } from '@app/types';

@Controller()
export class PostController {
  private readonly logger = new Logger(PostController.name);

  constructor(private readonly postService: PostService) {}

  @MessagePattern('post.health')
  healthCheck() {
    this.logger.log('Received health check request');
    return { status: 'ok', service: 'post' };
  }

  @MessagePattern('post.create')
  async createPost(@Payload() payload: { dto: CreatePostDto; userId: string }) {
    const { dto, userId } = payload;
    this.logger.log(`Received create post request from user ${userId}`);
    return this.postService.createPost(dto, userId);
  }

  @MessagePattern('post.get_all')
  async getPosts(@Payload() payload: { dto: GetPostsDto; userId: string }) {
    const { dto, userId } = payload;
    this.logger.log(`Received get all posts request from user ${userId}`);
    return this.postService.getPosts(dto, userId);
  }

  @MessagePattern('post.get_one')
  async getPost(@Payload() payload: { id: string; userId: string }) {
    const { id, userId } = payload;
    this.logger.log(`Received get post request: ${id} from user ${userId}`);
    return this.postService.getPost(id, userId);
  }
  @MessagePattern('post.like')
  async likePost(@Payload() payload: { postId: string; userId: string }) {
    const { postId, userId } = payload;
    this.logger.log(`Received like post request: ${postId} from ${userId}`);
    const likes = await this.postService.likePost(postId, userId);
    return { postId, likes };
  }

  @MessagePattern('post.unlike')
  async unlikePost(@Payload() payload: { postId: string; userId: string }) {
    const { postId, userId } = payload;
    this.logger.log(`Received unlike post request: ${postId} from ${userId}`);
    const likes = await this.postService.unlikePost(postId, userId);
    return { postId, likes };
  }

  @MessagePattern('post.get_likes')
  async getPostLikes(@Payload() dto: GetPostLikesDto) {
    this.logger.log(`Received get post likes request: ${dto.postId}`);
    return this.postService.getPostLikes(dto);
  }
}
