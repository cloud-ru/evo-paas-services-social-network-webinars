import { Injectable, Logger, Inject } from '@nestjs/common';
import { UserRepository } from './user.repository';
import {
  CreateUserProfileDto,
  GetUserProfileResponseDto,
  UpdateUserProfileDto,
  UserStatusResponseDto,
  UserStatus,
  GetOnlineUsersDto,
  GetOnlineUsersResponseDto,
  UserProfileDto,
  SignedUrlsResponseDto,
  SearchUsersDto,
} from '@app/types';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    @Inject('FILE_SERVICE') private readonly fileClient: ClientProxy,
  ) {}

  async createProfile(
    dto: CreateUserProfileDto,
  ): Promise<{ profileId: string; userId: string }> {
    this.logger.log(`Creating profile for user: ${dto.userId}`);

    try {
      const profile = await this.userRepository.create({
        userId: dto.userId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: UserStatus.OFFLINE,
        avatarUrl: null,
        bio: null,
      });

      this.logger.log(`Profile created successfully: ${profile.id}`);

      return {
        profileId: profile.id,
        userId: profile.userId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create profile for user ${dto.userId}`,
        error,
      );
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to create user profile',
      });
    }
  }

  async getUserProfile(userId: string): Promise<GetUserProfileResponseDto> {
    this.logger.log(`Getting profile for user: ${userId}`);

    const profile = await this.userRepository.findByUserId(userId);

    if (!profile) {
      this.logger.warn(`Profile not found for user: ${userId}`);
      throw new RpcException({
        statusCode: 404,
        status: 404,
        message: 'User does not exist',
        error: 'USER_NOT_FOUND',
      });
    }

    const avatarUrl = await this.signUrl(profile.avatarUrl);

    return {
      success: true,
      data: {
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarUrl,
        bio: profile.bio,
        status: profile.status as UserStatus,
        lastActivityAt: profile.lastActivityAt,
        createdAt: profile.createdAt,
      },
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<GetUserProfileResponseDto> {
    this.logger.log(`Updating profile for user: ${userId}`);

    try {
      const profile = await this.userRepository.update(userId, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        bio: dto.bio,
      });

      this.logger.log(`Profile updated successfully: ${profile.id}`);

      const avatarUrl = await this.signUrl(profile.avatarUrl);

      return {
        success: true,
        data: {
          userId: profile.userId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl,
          bio: profile.bio,
          status: profile.status as UserStatus,
          lastActivityAt: profile.lastActivityAt,
          createdAt: profile.createdAt,
        },
      };
    } catch (error) {
      const err = error as { code?: string };
      this.logger.error(`Failed to update profile for user ${userId}`, error);

      // Check if error is Prisma RecordNotFound
      if (err.code === 'P2025') {
        throw new RpcException({
          statusCode: 404,
          status: 404,
          message: 'User does not exist',
          error: 'USER_NOT_FOUND',
        });
      }

      throw new RpcException({
        statusCode: 500,
        message: 'Failed to update user profile',
      });
    }
  }

  async updateAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(`Updating avatar for user: ${userId}`);
    try {
      await this.userRepository.update(userId, { avatarUrl });
      this.logger.log(`Avatar updated for user: ${userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to update avatar for user ${userId}`, error);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to update avatar',
      });
    }
  }

  async updateStatus(
    userId: string,
    status: UserStatus,
  ): Promise<UserStatusResponseDto> {
    this.logger.log(`Updating status for user: ${userId} to ${status}`);

    try {
      const profile = await this.userRepository.update(userId, {
        status,
        lastActivityAt: new Date(),
      });

      return {
        status: profile.status as UserStatus,
        lastActivityAt: profile.lastActivityAt,
      };
    } catch (error) {
      this.logger.error(`Failed to update status for user ${userId}`, error);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to update user status',
      });
    }
  }

  async getUserStatus(userId: string): Promise<UserStatusResponseDto> {
    const profile = await this.userRepository.findByUserId(userId);

    if (!profile) {
      throw new RpcException({
        statusCode: 404,
        message: 'User does not exist',
      });
    }

    let status = UserStatus.OFFLINE;
    const lastActivity = profile.lastActivityAt;

    if (lastActivity) {
      const now = new Date();
      const diffInMinutes =
        (now.getTime() - new Date(lastActivity).getTime()) / 1000 / 60;

      if (diffInMinutes < 5) {
        status = UserStatus.ONLINE;
      } else if (diffInMinutes < 15) {
        status = UserStatus.AWAY;
      }
    }

    return {
      status,
      lastActivityAt: lastActivity,
    };
  }

  async getOnlineUsers(
    dto: GetOnlineUsersDto,
  ): Promise<GetOnlineUsersResponseDto> {
    const { limit = 20, offset = 0 } = dto;
    this.logger.log(
      `Getting online users with limit: ${limit}, offset: ${offset}`,
    );

    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const [users, total] = await Promise.all([
        this.userRepository.findOnlineUsers(limit, offset, fiveMinutesAgo),
        this.userRepository.countOnlineUsers(fiveMinutesAgo),
      ]);

      const signedUrls = await this.signUrls(
        users.map((u) => u.avatarUrl).filter(Boolean) as string[],
      );

      return {
        users: users.map((user) => ({
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl ? signedUrls[user.avatarUrl] : null,
          status: user.status,
          lastActivityAt: user.lastActivityAt,
        })),
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error('Failed to get online users', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to retrieve online users',
      });
    }
  }

  async getUsersByIds(userIds: string[]): Promise<UserProfileDto[]> {
    const profiles = await this.userRepository.findManyByIds(userIds);

    const signedUrls = await this.signUrls(
      profiles.map((p) => p.avatarUrl).filter(Boolean) as string[],
    );

    return profiles.map((profile) => ({
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl ? signedUrls[profile.avatarUrl] : null,
      bio: profile.bio,
      status: profile.status as UserStatus,
      lastActivityAt: profile.lastActivityAt,
      createdAt: profile.createdAt,
    }));
  }

  private async signUrl(url: string | null): Promise<string | null> {
    if (!url) return null;
    try {
      const { url: signedUrl } = await firstValueFrom(
        this.fileClient.send<{ url: string }>('file.get_signed_url', { url }),
      );
      return signedUrl;
    } catch (e) {
      this.logger.error(`Failed to sign url ${url}`, e);
      return url;
    }
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

  async searchUsers(
    dto: SearchUsersDto,
  ): Promise<{ users: UserProfileDto[]; total: number }> {
    const { query, limit = 20, offset = 0 } = dto;
    this.logger.log(`Searching users with query: ${query}`);

    if (!query) {
      return { users: [], total: 0 };
    }

    try {
      const [users, total] = await Promise.all([
        this.userRepository.search(query, limit, offset),
        this.userRepository.countSearch(query),
      ]);

      const signedUrls = await this.signUrls(
        users.map((u) => u.avatarUrl).filter(Boolean) as string[],
      );

      return {
        users: users.map((user) => ({
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl ? signedUrls[user.avatarUrl] : null,
          bio: user.bio,
          status: user.status as UserStatus,
          lastActivityAt: user.lastActivityAt,
          createdAt: user.createdAt,
        })),
        total,
      };
    } catch (error) {
      this.logger.error('Failed to search users', error);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to search users',
      });
    }
  }
}
