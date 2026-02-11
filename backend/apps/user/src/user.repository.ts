import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@app/prisma-user';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserProfileCreateInput) {
    this.logger.log(`Saving user profile to database: ${data.userId}`);
    return this.prisma.userProfile.create({
      data,
    });
  }

  async findByUserId(userId: string) {
    this.logger.log(`Finding user profile by userId: ${userId}`);
    return this.prisma.userProfile.findUnique({
      where: { userId },
    });
  }

  async update(userId: string, data: Prisma.UserProfileUpdateInput) {
    this.logger.log(`Updating user profile for user: ${userId}`);
    return this.prisma.userProfile.update({
      where: { userId },
      data,
    });
  }

  async findOnlineUsers(limit: number, offset: number, minLastActivity: Date) {
    this.logger.log(
      `Finding online users with limit ${limit}, offset ${offset}, since ${minLastActivity.toISOString()}`,
    );

    return this.prisma.userProfile.findMany({
      where: {
        status: 'online',
        lastActivityAt: {
          gte: minLastActivity,
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        lastActivityAt: 'desc',
      },
    });
  }

  async countOnlineUsers(minLastActivity: Date) {
    this.logger.log(
      `Counting online users since ${minLastActivity.toISOString()}`,
    );
    return this.prisma.userProfile.count({
      where: {
        status: 'online',
        lastActivityAt: {
          gte: minLastActivity,
        },
      },
    });
  }

  async findManyByIds(userIds: string[]) {
    this.logger.log(`Finding ${userIds.length} user profiles`);
    return this.prisma.userProfile.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });
  }

  async search(query: string, limit: number, offset: number) {
    this.logger.log(`Searching users with query: ${query}`);
    return this.prisma.userProfile.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      skip: offset,
      orderBy: {
        firstName: 'asc',
      },
    });
  }

  async countSearch(query: string) {
    return this.prisma.userProfile.count({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
  }
}
