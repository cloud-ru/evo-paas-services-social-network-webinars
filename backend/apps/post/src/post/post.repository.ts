import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Post, PostFile } from '@app/prisma-post';
import { CreatePostDto } from '@app/types';

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreatePostDto,
    authorId: string,
  ): Promise<Post & { files: PostFile[] }> {
    const { content, fileUrls } = data;

    return await this.prisma.client.post.create({
      data: {
        content,
        authorId,
        files: {
          create: fileUrls?.map((url) => ({ url })) || [],
        },
      },
      include: {
        files: true,
      },
    });
  }

  async findAll(
    limit: number,
    offset: number,
    userId: string,
    authorId?: string,
  ): Promise<
    [(Post & { files: PostFile[]; likes: { userId: string }[] })[], number]
  > {
    return await this.prisma.client.$transaction([
      this.prisma.client.post.findMany({
        where: {
          ...(authorId && { authorId }),
        },
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          content: true,
          authorId: true,
          likesCount: true,
          createdAt: true,
          updatedAt: true,
          files: true,
          likes: {
            where: { userId },
            select: { userId: true },
          },
        },
      }),
      this.prisma.client.post.count({
        where: {
          ...(authorId && { authorId }),
        },
      }),
    ]);
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<
    (Post & { files: PostFile[]; likes: { userId: string }[] }) | null
  > {
    return await this.prisma.client.post.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        authorId: true,
        likesCount: true,
        createdAt: true,
        updatedAt: true,
        files: true,
        likes: {
          where: { userId },
          select: { userId: true },
        },
      },
    });
  }

  async like(postId: string, userId: string): Promise<number> {
    try {
      const [, post] = await this.prisma.client.$transaction([
        this.prisma.client.like.create({
          data: {
            postId,
            userId,
          },
        }),
        this.prisma.client.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      return post.likesCount;
    } catch (error) {
      if ((error as { code: string }).code === 'P2002') {
        // Already liked, return current count
        const post = await this.prisma.client.post.findUnique({
          where: { id: postId },
          select: { likesCount: true },
        });
        return post?.likesCount || 0;
      }
      throw error;
    }
  }

  async unlike(postId: string, userId: string): Promise<number> {
    try {
      const [, post] = await this.prisma.client.$transaction([
        this.prisma.client.like.delete({
          where: {
            postId_userId: {
              postId,
              userId,
            },
          },
        }),
        this.prisma.client.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      return post.likesCount;
    } catch (error) {
      if ((error as { code: string }).code === 'P2025') {
        // Like not found, return current count
        const post = await this.prisma.client.post.findUnique({
          where: { id: postId },
          select: { likesCount: true },
        });
        return post?.likesCount || 0;
      }
      throw error;
    }
  }

  async findLikes(
    postId: string,
    limit: number,
    offset: number,
  ): Promise<[{ userId: string; createdAt: Date }[], number]> {
    return await this.prisma.client.$transaction([
      this.prisma.client.like.findMany({
        where: { postId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: { userId: true, createdAt: true },
      }),
      this.prisma.client.like.count({ where: { postId } }),
    ]);
  }
}
