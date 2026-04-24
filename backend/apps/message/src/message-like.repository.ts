import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class MessageLikeRepository {
  private readonly logger = new Logger(MessageLikeRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a like by message ID and user ID
   */
  async findLike(messageId: string, userId: string) {
    this.logger.log(`Finding like for message ${messageId} by user ${userId}`);
    return await this.prisma.client.messageLike.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });
  }

  /**
   * Create a like and increment the message likes count
   */
  async createLike(messageId: string, userId: string) {
    this.logger.log(`Creating like for message ${messageId} by user ${userId}`);
    return await this.prisma.client.$transaction(async (tx) => {
      await tx.messageLike.create({
        data: {
          messageId,
          userId,
        },
      });
      const updatedMessage = await tx.message.update({
        where: { id: messageId },
        data: { likesCount: { increment: 1 } },
      });
      return updatedMessage.likesCount;
    });
  }

  /**
   * Delete a like and decrement the message likes count
   */
  async deleteLike(messageId: string, userId: string) {
    this.logger.log(`Deleting like for message ${messageId} by user ${userId}`);
    return await this.prisma.client.$transaction(async (tx) => {
      await tx.messageLike.delete({
        where: {
          messageId_userId: {
            messageId,
            userId,
          },
        },
      });
      const updatedMessage = await tx.message.update({
        where: { id: messageId },
        data: { likesCount: { decrement: 1 } },
      });
      return updatedMessage.likesCount;
    });
  }

  /**
   * Get the current likes count for a message
   */
  async getLikesCount(messageId: string): Promise<number> {
    this.logger.log(`Getting likes count for message ${messageId}`);
    const message = await this.prisma.client.message.findUnique({
      where: { id: messageId },
      select: { likesCount: true },
    });
    return message?.likesCount ?? 0;
  }
}
