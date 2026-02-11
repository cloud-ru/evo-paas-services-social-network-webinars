import { Inject, Injectable, Logger } from '@nestjs/common';
import { MessageRepository } from './message.repository';
import { MessageLikeRepository } from './message-like.repository';
import {
  CreateMessageDto,
  MessageResponseDto,
  GetMessagesDto,
  GetMessagesResponseDto,
  DeleteMessageResponseDto,
  SearchMessagesDto,
  SearchMessagesResponseDto,
  LikeMessageResponseDto,
  GetConversationsDto,
  GetConversationsResponseDto,
  GetUnreadCountResponseDto,
} from '@app/types';

import { RpcException, ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly messageLikeRepository: MessageLikeRepository,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  async createMessage(
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    this.logger.log(`Creating message from ${senderId} to ${dto.recipientId}`);

    // Verify recipient exists
    try {
      this.logger.log(`Verifying recipient ${dto.recipientId} exists`);
      await firstValueFrom(
        this.userClient.send('user.get-profile', { userId: dto.recipientId }),
      );
    } catch (error) {
      this.logger.warn(`Recipient not found: ${dto.recipientId}`, error);
      throw new RpcException({
        statusCode: 404,
        message: 'Recipient not found',
      });
    }

    const message = await this.messageRepository.create({
      senderId,
      recipientId: dto.recipientId,
      content: dto.content,
    });

    return {
      id: message.id,
      senderId: message.senderId,
      recipientId: message.recipientId,
      content: message.content,
      createdAt: message.createdAt,
      likesCount: 0,
      isLiked: false,
    };
  }

  async getMessages(
    currentUserId: string,
    otherUserId: string,
    query: GetMessagesDto,
  ): Promise<GetMessagesResponseDto> {
    this.logger.log(
      `Getting messages between ${currentUserId} and ${otherUserId}`,
    );

    const { messages, total } = await this.messageRepository.findConversation(
      currentUserId,
      otherUserId,
      query.limit ?? 20,
      query.offset ?? 0,
    );

    return {
      messages: messages.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        content: msg.content,
        createdAt: msg.createdAt,
        likesCount: msg.likesCount,
        isLiked: msg['likes']?.length > 0,
      })),
      total,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    };
  }

  async deleteMessage(
    userId: string,
    messageId: string,
  ): Promise<DeleteMessageResponseDto> {
    this.logger.log(`Deleting message ${messageId} by user ${userId}`);

    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw new RpcException({
        statusCode: 404,
        message: 'Message not found',
      });
    }

    if (message.senderId !== userId) {
      throw new RpcException({
        statusCode: 403,
        message: 'You can only delete your own messages',
      });
    }

    await this.messageRepository.softDelete(messageId);

    return { success: true };
  }

  async searchMessages(
    currentUserId: string,
    otherUserId: string,
    dto: SearchMessagesDto,
  ): Promise<SearchMessagesResponseDto> {
    this.logger.log(
      `Searching messages between ${currentUserId} and ${otherUserId} with query: ${dto.query}`,
    );

    const { messages, total } = await this.messageRepository.searchMessages(
      currentUserId,
      otherUserId,
      dto.query,
      dto.limit ?? 20,
      dto.offset ?? 0,
    );

    return {
      messages: messages.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        content: msg.content,
        createdAt: msg.createdAt,
        likesCount: msg.likesCount,
        isLiked: msg['likes']?.length > 0,
      })),
      total,
    };
  }

  /**
   * Like a message
   */
  async likeMessage(
    userId: string,
    messageId: string,
  ): Promise<LikeMessageResponseDto> {
    this.logger.log(`User ${userId} liking message ${messageId}`);

    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new RpcException({
        statusCode: 404,
        message: 'Message not found',
      });
    }

    const existingLike = await this.messageLikeRepository.findLike(
      messageId,
      userId,
    );
    if (existingLike) {
      throw new RpcException({
        statusCode: 400,
        message: 'You have already liked this message',
      });
    }

    const likesCount = await this.messageLikeRepository.createLike(
      messageId,
      userId,
    );

    return {
      messageId,
      likes: likesCount,
    };
  }

  /**
   * Unlike a message
   */
  async unlikeMessage(
    userId: string,
    messageId: string,
  ): Promise<LikeMessageResponseDto> {
    this.logger.log(`User ${userId} unliking message ${messageId}`);

    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new RpcException({
        statusCode: 404,
        message: 'Message not found',
      });
    }

    const existingLike = await this.messageLikeRepository.findLike(
      messageId,
      userId,
    );
    if (!existingLike) {
      throw new RpcException({
        statusCode: 400,
        message: 'You have not liked this message',
      });
    }

    const likesCount = await this.messageLikeRepository.deleteLike(
      messageId,
      userId,
    );

    return {
      messageId,
      likes: likesCount,
    };
  }

  /**
   * Get conversations list for a user
   */
  async getConversations(
    userId: string,
    query: GetConversationsDto,
  ): Promise<GetConversationsResponseDto> {
    this.logger.log(`Getting conversations for user ${userId}`);

    const { conversations, total } =
      await this.messageRepository.findConversations(
        userId,
        query.limit ?? 20,
        query.offset ?? 0,
      );

    return {
      conversations,
      total,
    };
  }

  /**
   * Get total count of unread messages for a user
   */
  async getUnreadCount(userId: string): Promise<GetUnreadCountResponseDto> {
    this.logger.log(`Getting unread count for user ${userId}`);
    const unreadCount = await this.messageRepository.countUnread(userId);
    return { unreadCount };
  }
}
