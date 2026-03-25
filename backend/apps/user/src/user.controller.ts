import { Controller, Logger, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import {
  CreateUserProfileDto,
  GetUserProfileResponseDto,
  UpdateUserProfileDto,
  UserStatusResponseDto,
  UpdateUserStatusDto,
  GetOnlineUsersDto,
  GetOnlineUsersResponseDto,
  UserProfileDto,
  SearchUsersDto,
} from '@app/types';

@Controller()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get('health')
  healthCheckHttp() {
    this.logger.log('Received HTTP health check request');
    return { status: 'ok', service: 'user' };
  }

  @MessagePattern('create_user_profile')
  async createUserProfile(@Payload() dto: CreateUserProfileDto) {
    this.logger.log(
      `Received create_user_profile request for user: ${dto.userId}`,
    );
    return this.userService.createProfile(dto);
  }

  @MessagePattern('user.update-profile')
  async updateUserProfile(
    @Payload() payload: { userId: string; dto: UpdateUserProfileDto },
  ): Promise<GetUserProfileResponseDto> {
    this.logger.log(
      `Received update-profile request for user: ${payload.userId}`,
    );
    return this.userService.updateProfile(payload.userId, payload.dto);
  }

  @MessagePattern('user.update-avatar')
  async updateAvatar(
    @Payload() payload: { userId: string; avatarUrl: string },
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `Received update-avatar request for user: ${payload.userId}`,
    );
    return this.userService.updateAvatar(payload.userId, payload.avatarUrl);
  }

  @MessagePattern('user.get-profile')
  async getUserProfile(
    @Payload() payload: { userId: string },
  ): Promise<GetUserProfileResponseDto> {
    this.logger.log(`Received get-profile request for user: ${payload.userId}`);
    return this.userService.getUserProfile(payload.userId);
  }

  @MessagePattern('user.get_me')
  async getMe(
    @Payload() payload: { userId: string },
  ): Promise<GetUserProfileResponseDto> {
    this.logger.log(`Received get-me request for user: ${payload.userId}`);
    return this.userService.getUserProfile(payload.userId);
  }

  @MessagePattern('user.get-status')
  async getUserStatus(
    @Payload() payload: { userId: string },
  ): Promise<UserStatusResponseDto> {
    return this.userService.getUserStatus(payload.userId);
  }

  @MessagePattern('user.update-status')
  async updateUserStatus(
    @Payload() payload: { userId: string; dto: UpdateUserStatusDto },
  ): Promise<UserStatusResponseDto> {
    this.logger.log(
      `Received update-status request for user: ${payload.userId}`,
    );
    return this.userService.updateStatus(payload.userId, payload.dto.status);
  }

  @MessagePattern('user.get-online')
  async getOnlineUsers(
    @Payload() dto: GetOnlineUsersDto,
  ): Promise<GetOnlineUsersResponseDto> {
    this.logger.log(`Received get-online-users request`);
    return this.userService.getOnlineUsers(dto);
  }

  @MessagePattern('user.get_many')
  async getUsersByIds(@Payload() ids: string[]): Promise<UserProfileDto[]> {
    this.logger.log(`Received get-many users request for ${ids.length} ids`);
    return this.userService.getUsersByIds(ids);
  }

  @MessagePattern('user.search')
  async searchUsers(@Payload() dto: SearchUsersDto) {
    this.logger.log(`Received searchUsers request: ${JSON.stringify(dto)}`);
    return this.userService.searchUsers(dto);
  }

  @MessagePattern('user.health')
  healthCheck() {
    this.logger.log('Received health check request');
    return { status: 'ok', service: 'user' };
  }
}
