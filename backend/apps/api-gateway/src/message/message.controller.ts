import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Logger,
  UseGuards,
  HttpException,
  Param,
  Query,
  Delete,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateMessageDto,
  MessageResponseDto,
  CurrentUserDto,
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
import { ChatGateway } from '../chat.gateway';

@ApiTags('Message')
@Controller('message')
export class MessageController {
  private readonly logger = new Logger(MessageController.name);

  constructor(
    @Inject('MESSAGE_SERVICE') private readonly messageClient: ClientProxy,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check message service health' })
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
    this.logger.log('Proxying health check to message service');
    const result = await firstValueFrom(
      this.messageClient.send<{ status: string; service: string }>(
        'message.health',
        {},
      ),
    );
    return result;
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a direct message' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    type: MessageResponseDto,
  })
  async createMessage(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    this.logger.log(`Creating message from user ${user.userId}`);

    try {
      const result = await firstValueFrom(
        this.messageClient.send<MessageResponseDto>('message.create', {
          senderId: user.userId,
          dto,
        }),
      );

      // Send real-time notification
      this.chatGateway.sendMessageNotification(dto.recipientId, result);

      return result;
    } catch (error) {
      this.logger.error('Failed to create message', error);
      const err = error as {
        message?: string;
        statusCode?: number;
        status?: number;
      };
      const status = Number(err?.statusCode || err?.status || 500);
      throw new HttpException(
        {
          statusCode: status,
          message: err?.message || 'Failed to create message',
        },
        status,
      );
    }
  }

  @Get('conversations')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of conversations' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of conversations with latest message preview',
    type: GetConversationsResponseDto,
  })
  async getConversations(
    @Query() query: GetConversationsDto,
    @CurrentUser() user: CurrentUserDto,
  ): Promise<GetConversationsResponseDto> {
    this.logger.log(`Getting conversations for user ${user.userId}`);
    try {
      return await firstValueFrom(
        this.messageClient.send<GetConversationsResponseDto>(
          'message.conversations',
          {
            userId: user.userId,
            query,
          },
        ),
      );
    } catch (error) {
      this.logger.error('Failed to get conversations', error);
      const err = error as {
        message?: string;
        statusCode?: number;
        status?: number;
      };
      const status = Number(err?.statusCode || err?.status || 500);
      throw new HttpException(
        {
          statusCode: status,
          message: err?.message || 'Failed to get conversations',
        },
        status,
      );
    }
  }

  @Get('unread')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get count of unread messages' })
  @ApiResponse({
    status: 200,
    description: 'Returns count of unread messages across all conversations',
    type: GetUnreadCountResponseDto,
  })
  async getUnreadCount(
    @CurrentUser() user: CurrentUserDto,
  ): Promise<GetUnreadCountResponseDto> {
    this.logger.log(`Getting unread count for user ${user.userId}`);
    try {
      return await firstValueFrom(
        this.messageClient.send<GetUnreadCountResponseDto>(
          'message.unread-count',
          {
            userId: user.userId,
          },
        ),
      );
    } catch (error) {
      this.logger.error('Failed to get unread count', error);
      const err = error as {
        message?: string;
        statusCode?: number;
        status?: number;
      };
      const status = Number(err?.statusCode || err?.status || 500);
      throw new HttpException(
        {
          statusCode: status,
          message: err?.message || 'Failed to get unread count',
        },
        status,
      );
    }
  }

  @Get(':userId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversation history with another user' })
  @ApiParam({ name: 'userId', description: 'ID of the other user' })
  @ApiResponse({
    status: 200,
    description: 'Returns message history',
    type: GetMessagesResponseDto,
  })
  async getMessages(
    @Param('userId') otherUserId: string,
    @Query() query: GetMessagesDto,
    @CurrentUser() user: CurrentUserDto,
  ): Promise<GetMessagesResponseDto> {
    this.logger.log(
      `Getting messages for user ${user.userId} with ${otherUserId}`,
    );
    return firstValueFrom(
      this.messageClient.send<GetMessagesResponseDto>('message.list', {
        currentUserId: user.userId,
        otherUserId,
        query,
      }),
    );
  }

  @Delete(':messageId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'messageId', description: 'ID of the message to delete' })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
    type: DeleteMessageResponseDto,
  })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: CurrentUserDto,
  ): Promise<DeleteMessageResponseDto> {
    this.logger.log(`Deleting message ${messageId} for user ${user.userId}`);
    try {
      return await firstValueFrom(
        this.messageClient.send<DeleteMessageResponseDto>('message.delete', {
          userId: user.userId,
          messageId,
        }),
      );
    } catch (error) {
      this.logger.error('Failed to delete message', error);
      const err = error as {
        message?: string;
        statusCode?: number;
        status?: number;
      };
      const status = Number(err?.statusCode || err?.status || 500);
      throw new HttpException(
        {
          statusCode: status, // Keep consistent error structure
          message: err?.message || 'Failed to delete message',
        },
        status,
      );
    }
  }

  @Get(':userId/search')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search messages in conversation' })
  @ApiParam({ name: 'userId', description: 'ID of the other user' })
  async searchMessages(
    @Param('userId') otherUserId: string,
    @Query() query: SearchMessagesDto,
    @CurrentUser() user: CurrentUserDto,
  ): Promise<SearchMessagesResponseDto> {
    this.logger.log(
      `Searching messages for user ${user.userId} with ${otherUserId} query: ${query.query}`,
    );
    return firstValueFrom(
      this.messageClient.send<SearchMessagesResponseDto>('message.search', {
        currentUserId: user.userId,
        otherUserId,
        query,
      }),
    );
  }

  @Post(':messageId/like')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like a message' })
  @ApiParam({ name: 'messageId', description: 'ID of the message to like' })
  @ApiResponse({
    status: 200,
    description: 'Message liked successfully',
    type: LikeMessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Message already liked',
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  async likeMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: CurrentUserDto,
  ): Promise<LikeMessageResponseDto> {
    this.logger.log(`User ${user.userId} liking message ${messageId}`);
    try {
      return await firstValueFrom(
        this.messageClient.send<LikeMessageResponseDto>('message.like', {
          userId: user.userId,
          messageId,
        }),
      );
    } catch (error) {
      this.logger.error('Failed to like message', error);
      const err = error as {
        message?: string;
        statusCode?: number;
        status?: number;
      };
      const status = Number(err?.statusCode || err?.status || 500);
      throw new HttpException(
        {
          statusCode: status,
          message: err?.message || 'Failed to like message',
        },
        status,
      );
    }
  }

  @Delete(':messageId/like')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlike a message' })
  @ApiParam({ name: 'messageId', description: 'ID of the message to unlike' })
  @ApiResponse({
    status: 200,
    description: 'Message unliked successfully',
    type: LikeMessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Message not liked yet',
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  async unlikeMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: CurrentUserDto,
  ): Promise<LikeMessageResponseDto> {
    this.logger.log(`User ${user.userId} unliking message ${messageId}`);
    try {
      return await firstValueFrom(
        this.messageClient.send<LikeMessageResponseDto>('message.unlike', {
          userId: user.userId,
          messageId,
        }),
      );
    } catch (error) {
      this.logger.error('Failed to unlike message', error);
      const err = error as {
        message?: string;
        statusCode?: number;
        status?: number;
      };
      const status = Number(err?.statusCode || err?.status || 500);
      throw new HttpException(
        {
          statusCode: status,
          message: err?.message || 'Failed to unlike message',
        },
        status,
      );
    }
  }
}
