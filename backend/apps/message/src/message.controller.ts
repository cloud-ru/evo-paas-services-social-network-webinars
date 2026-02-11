import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessageService } from './message.service';
import {
  CreateMessageDto,
  MessageResponseDto,
  GetMessagesDto,
  GetMessagesResponseDto,
  SearchMessagesDto,
  SearchMessagesResponseDto,
  LikeMessageResponseDto,
  GetConversationsDto,
  GetConversationsResponseDto,
  GetUnreadCountResponseDto,
} from '@app/types';

@Controller()
export class MessageController {
  private readonly logger = new Logger(MessageController.name);

  constructor(private readonly messageService: MessageService) {}

  @MessagePattern('message.health')
  healthCheck() {
    this.logger.log('Received health check request');
    return { status: 'ok', service: 'message' };
  }

  @MessagePattern('message.create')
  async createMessage(
    @Payload() payload: { senderId: string; dto: CreateMessageDto },
  ): Promise<MessageResponseDto> {
    this.logger.log(`Received create message request from ${payload.senderId}`);
    return this.messageService.createMessage(payload.senderId, payload.dto);
  }

  @MessagePattern('message.list')
  async getMessages(
    @Payload()
    payload: {
      currentUserId: string;
      otherUserId: string;
      query: GetMessagesDto;
    },
  ): Promise<GetMessagesResponseDto> {
    this.logger.log(
      `Received get messages request from ${payload.currentUserId}`,
    );
    return this.messageService.getMessages(
      payload.currentUserId,
      payload.otherUserId,
      payload.query,
    );
  }

  @MessagePattern('message.delete')
  async deleteMessage(
    @Payload() payload: { userId: string; messageId: string },
  ) {
    this.logger.log(
      `Received delete message request from ${payload.userId} for message ${payload.messageId}`,
    );
    return this.messageService.deleteMessage(payload.userId, payload.messageId);
  }

  @MessagePattern('message.search')
  async searchMessages(
    @Payload()
    payload: {
      currentUserId: string;
      otherUserId: string;
      query: SearchMessagesDto;
    },
  ): Promise<SearchMessagesResponseDto> {
    this.logger.log(
      `Received search messages request from ${payload.currentUserId}`,
    );
    return this.messageService.searchMessages(
      payload.currentUserId,
      payload.otherUserId,
      payload.query,
    );
  }

  @MessagePattern('message.like')
  async likeMessage(
    @Payload() payload: { userId: string; messageId: string },
  ): Promise<LikeMessageResponseDto> {
    this.logger.log(
      `Received like message request from ${payload.userId} for message ${payload.messageId}`,
    );
    return this.messageService.likeMessage(payload.userId, payload.messageId);
  }

  @MessagePattern('message.unlike')
  async unlikeMessage(
    @Payload() payload: { userId: string; messageId: string },
  ): Promise<LikeMessageResponseDto> {
    this.logger.log(
      `Received unlike message request from ${payload.userId} for message ${payload.messageId}`,
    );
    return this.messageService.unlikeMessage(payload.userId, payload.messageId);
  }

  @MessagePattern('message.conversations')
  async getConversations(
    @Payload() payload: { userId: string; query: GetConversationsDto },
  ): Promise<GetConversationsResponseDto> {
    this.logger.log(
      `Received get conversations request from ${payload.userId}`,
    );
    return this.messageService.getConversations(payload.userId, payload.query);
  }

  @MessagePattern('message.unread-count')
  async getUnreadCount(
    @Payload() payload: { userId: string },
  ): Promise<GetUnreadCountResponseDto> {
    this.logger.log(`Received get unread count request from ${payload.userId}`);
    return this.messageService.getUnreadCount(payload.userId);
  }
}
