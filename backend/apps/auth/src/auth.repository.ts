import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@app/prisma-auth';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    this.logger.log(`Finding user by email: ${email}`);
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUserWithVerification(
    userData: Prisma.UserCreateInput,
    verificationToken: string,
    verificationExpiresAt: Date,
  ) {
    this.logger.log(`Creating user with verification: ${userData.email}`);
    return this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: userData,
      });

      await tx.emailVerification.create({
        data: {
          userId: newUser.id,
          token: verificationToken,
          expiresAt: verificationExpiresAt,
        },
      });

      return newUser;
    });
  }

  async findVerificationByToken(token: string) {
    this.logger.log(`Finding verification by token`);
    return this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async verifyUserEmail(userId: string, verificationId: string) {
    this.logger.log(`Verifying email for user: ${userId}`);
    return this.prisma.$transaction(async (tx) => {
      // Update user email_verified flag
      await tx.user.update({
        where: { id: userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      // Mark verification as completed
      await tx.emailVerification.update({
        where: { id: verificationId },
        data: {
          verifiedAt: new Date(),
        },
      });

      // Delete token for security (prevent reuse)
      await tx.emailVerification.delete({
        where: { id: verificationId },
      });
    });
  }

  async createSessionWithToken(
    sessionData: Prisma.SessionUncheckedCreateInput,
    tokenData: Omit<Prisma.TokenUncheckedCreateInput, 'sessionId'>,
  ) {
    this.logger.log(`Creating session for user: ${sessionData.userId}`);
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.session.create({
        data: sessionData,
      });

      await tx.token.create({
        data: {
          ...tokenData,
          sessionId: session.id,
        },
      });
      return { session };
    });
  }

  async findTokenByRefreshToken(refreshToken: string) {
    this.logger.log(`Finding token by refresh token`);
    return this.prisma.token.findUnique({
      where: { refreshToken },
      include: { user: true },
    });
  }

  async updateToken(id: string, data: Prisma.TokenUpdateInput) {
    this.logger.log(`Updating token: ${id}`);
    return this.prisma.token.update({
      where: { id },
      data,
    });
  }

  async findTokenByAccessToken(accessToken: string) {
    this.logger.log(`Finding token by access token`);
    return this.prisma.token.findFirst({
      where: { accessToken },
    });
  }

  async revokeToken(id: string) {
    this.logger.log(`Revoking token: ${id}`);
    return this.prisma.token.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async createPasswordReset(data: Prisma.PasswordResetUncheckedCreateInput) {
    this.logger.log(`Creating password reset for user`);
    return this.prisma.passwordReset.create({
      data,
    });
  }

  async findPasswordResetByToken(token: string) {
    this.logger.log(`Finding password reset by token`);
    return this.prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async resetPassword(
    userId: string,
    resetId: string,
    newPasswordHash: string,
  ) {
    this.logger.log(`Resetting password for user: ${userId}`);
    return this.prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
        },
      });

      // Mark reset token as used
      await tx.passwordReset.update({
        where: { id: resetId },
        data: {
          usedAt: new Date(),
        },
      });

      // Revoke ALL tokens for this user (force re-login everywhere)
      await tx.token.updateMany({
        where: {
          userId: userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    });
  }

  async findSessionsByUserId(userId: string) {
    this.logger.log(`Finding sessions for user: ${userId}`);
    return this.prisma.session.findMany({
      where: { userId },
      include: {
        tokens: {
          select: {
            accessToken: true,
            revokedAt: true,
            refreshTokenExpiresAt: true,
          },
        },
      },
      orderBy: { lastActivityAt: 'desc' },
    });
  }

  async findSessionById(id: string) {
    this.logger.log(`Finding session by id: ${id}`);
    return this.prisma.session.findUnique({
      where: { id },
    });
  }

  async revokeSessionTokens(sessionId: string) {
    this.logger.log(`Revoking tokens for session: ${sessionId}`);
    return this.prisma.token.updateMany({
      where: { sessionId: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
