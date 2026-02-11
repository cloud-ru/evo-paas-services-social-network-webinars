import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Inject,
  Logger,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
  GetUserProfileResponseDto,
  UpdateUserProfileDto,
  UploadFileDto,
  AvatarUploadResponseDto,
  UserStatusResponseDto,
  UpdateUserStatusDto,
  GetOnlineUsersDto,
  GetOnlineUsersResponseDto,
  SearchUsersDto,
  UserProfileDto,
} from '@app/types';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('User')
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    @Inject('FILE_SERVICE') private readonly fileClient: ClientProxy,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check user service health' })
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
    this.logger.log('Proxying health check to user service');
    const result = await firstValueFrom(
      this.userClient.send<{ status: string; service: string }>(
        'user.health',
        {},
      ),
    );
    return result;
  }

  @UseGuards(AuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: GetUserProfileResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @ApiNotFoundResponse({ description: 'User does not exist' })
  async getMe(
    @Req() req: Request & { user: { userId: string } },
  ): Promise<GetUserProfileResponseDto> {
    const userId = req.user.userId;
    this.logger.log(`Getting profile for current user: ${userId}`);

    try {
      const result = await firstValueFrom(
        this.userClient.send<GetUserProfileResponseDto>('user.get_me', {
          userId,
        }),
      );
      return result;
    } catch (error) {
      this.handleError(error, 'Get current user profile failed');
    }
  }

  @UseGuards(AuthGuard)
  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: GetUserProfileResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async updateProfile(
    @Body() dto: UpdateUserProfileDto,
    @Req() req: Request & { user: { userId: string } },
  ): Promise<GetUserProfileResponseDto> {
    const userId = req.user.userId;
    this.logger.log(`Updating profile for user: ${userId}`);

    try {
      const result = await firstValueFrom(
        this.userClient.send<GetUserProfileResponseDto>('user.update-profile', {
          userId,
          dto,
        }),
      );
      return result;
    } catch (error) {
      this.handleError(error, 'Update user profile failed');
    }
  }

  @UseGuards(AuthGuard)
  @Post('me/avatar')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
    type: AvatarUploadResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|gif)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024, // 5MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    )
    file: Express.Multer.File,
    @Req() req: Request & { user: { userId: string } },
  ): Promise<AvatarUploadResponseDto> {
    const userId = req.user.userId;
    this.logger.log(`Uploading avatar for user: ${userId}`);

    try {
      // 1. Upload to File Service (S3)
      const uploadDto: UploadFileDto = {
        file: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
        userId,
      };

      const avatarUrl = await firstValueFrom(
        this.fileClient.send<string>('file.upload_avatar', uploadDto),
      );

      // 2. Update User Profile
      await firstValueFrom(
        this.userClient.send('user.update-avatar', {
          userId,
          avatarUrl,
        }),
      );

      return {
        avatarUrl,
        message: 'Avatar uploaded successfully',
      };
    } catch (error) {
      this.handleError(error, 'Avatar upload failed');
    }
  }

  @UseGuards(AuthGuard)
  @Put(':userId/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user status' })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
    type: UserStatusResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async updateStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: Request & { user: { userId: string } },
  ): Promise<UserStatusResponseDto> {
    const currentUserId = req.user.userId;
    if (userId !== currentUserId) {
      this.logger.warn(
        `User ${currentUserId} attempted to update status for ${userId}`,
      );

      throw new HttpException(
        'You can only update your own status',
        HttpStatus.FORBIDDEN,
      );
    }

    this.logger.log(`Updating status for user: ${userId} to ${dto.status}`);

    try {
      const result = await firstValueFrom(
        this.userClient.send<UserStatusResponseDto>('user.update-status', {
          userId,
          dto,
        }),
      );
      return result;
    } catch (error) {
      this.handleError(error, 'Update user status failed');
    }
  }

  @UseGuards(AuthGuard)
  @Get(':userId/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user online status' })
  @ApiResponse({
    status: 200,
    description: 'User status retrieved successfully',
    type: UserStatusResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @ApiNotFoundResponse({ description: 'User does not exist' })
  async getUserStatus(
    @Param('userId') userId: string,
  ): Promise<UserStatusResponseDto> {
    this.logger.log(`Getting status for user: ${userId}`);

    try {
      const result = await firstValueFrom(
        this.userClient.send<UserStatusResponseDto>('user.get-status', {
          userId,
        }),
      );
      return result;
    } catch (error) {
      this.handleError(error, 'Get user status failed');
    }
  }

  @UseGuards(AuthGuard)
  @Get('online')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get online users' })
  @ApiResponse({
    status: 200,
    description: 'List of online users retrieved successfully',
    type: GetOnlineUsersResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async getOnlineUsers(
    @Query() dto: GetOnlineUsersDto,
  ): Promise<GetOnlineUsersResponseDto> {
    this.logger.log('Getting online users');

    try {
      const result = await firstValueFrom(
        this.userClient.send<GetOnlineUsersResponseDto>('user.get-online', dto),
      );
      return result;
    } catch (error) {
      this.handleError(error, 'Failed to get online users');
    }
  }

  @UseGuards(AuthGuard)
  @Get('search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: { $ref: '#/components/schemas/UserProfileDto' },
        },
        total: { type: 'number' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  async searchUsers(
    @Query() dto: SearchUsersDto,
  ): Promise<{ users: UserProfileDto[]; total: number }> {
    this.logger.log(`Searching users with query: ${dto.query}`);

    try {
      const result = await firstValueFrom(
        this.userClient.send<{ users: UserProfileDto[]; total: number }>(
          'user.search',
          dto,
        ),
      );
      return result;
    } catch (error) {
      this.handleError(error, 'Search users failed');
    }
  }

  @UseGuards(AuthGuard)
  @Get(':userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: GetUserProfileResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired token' })
  @ApiNotFoundResponse({ description: 'User does not exist' })
  async getUserProfile(
    @Param('userId') userId: string,
  ): Promise<GetUserProfileResponseDto> {
    this.logger.log(`Getting profile for user: ${userId}`);

    try {
      const result = await firstValueFrom(
        this.userClient.send<GetUserProfileResponseDto>('user.get-profile', {
          userId,
        }),
      );
      return result;
    } catch (error) {
      this.handleError(error, 'Get user profile failed');
    }
  }

  private handleError(error: unknown, defaultMessage: string): never {
    const err = error as {
      message?: string;
      stack?: string;
      status?: number;
      statusCode?: number;
      error?: string;
    };

    this.logger.error(`${defaultMessage}: ${err?.message}`, err?.stack);

    const status =
      Number(err?.status || err?.statusCode) ||
      HttpStatus.INTERNAL_SERVER_ERROR;

    throw new HttpException(
      {
        statusCode: status,
        message: String(err?.message || defaultMessage),
        error: String(err?.error || 'Internal Server Error'),
      },
      status,
    );
  }
}
