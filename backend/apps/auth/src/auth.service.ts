import { Injectable, Logger, Inject } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { RateLimitService } from './rate-limit.service';
import {
  RegisterRequestDto,
  RegisterResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RefreshRequestDto,
  RefreshResponseDto,
  LogoutRequestDto,
  LogoutResponseDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  ResetPasswordRequestDto,
  ResetPasswordResponseDto,
  GetSessionsResponseDto,
  RevokeSessionResponseDto,
  SessionDto,
} from '@app/types';

import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { UAParser } from 'ua-parser-js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly rateLimitService: RateLimitService,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  async register(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    this.logger.log(`Attempting to register user: ${dto.email}`);

    // 1. Check if user exists
    const existingUser = await this.authRepository.findUserByEmail(dto.email);

    if (existingUser) {
      this.logger.warn(
        `Registration failed: Email ${dto.email} already exists`,
      );
      throw new RpcException({
        statusCode: 409,
        status: 409,
        message: 'Email already registered',
        error: 'Conflict',
      });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // 3. Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 24 hours

    // 4. Create User and Verification Record Transactionally
    const user = await this.authRepository.createUserWithVerification(
      {
        email: dto.email,
        passwordHash: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        accountStatus: 'active',
      },
      token,
      expiresAt,
    );

    this.logger.log(`User registered successfully: ${user.id}`);

    // 5. Trigger Email Service from Queue
    this.emailClient.emit('user.registered', {
      userId: user.id,
      email: user.email,
      name: user.firstName,
      token: token,
    });

    // 6. Create User Profile
    try {
      this.logger.log(`Creating user profile for user: ${user.id}`);
      this.userClient.emit('create_user_profile', {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error) {
      // Non-blocking error logging
      this.logger.error(
        `Failed to trigger profile creation for user ${user.id}`,
        error,
      );
    }

    return {
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        message: 'Verification email sent. Please check your inbox.',
      },
    };
  }

  async verifyEmail(token: string) {
    this.logger.log(
      `Attempting to verify email with token: ${token.substring(0, 8)}...`,
    );

    // 1. Find verification record
    const verification =
      await this.authRepository.findVerificationByToken(token);

    // 2. Check if token exists
    if (!verification) {
      this.logger.warn(`Verification failed: Invalid token`);
      throw new RpcException({
        statusCode: 400,
        status: 400,
        message: 'Verification token is invalid or expired',
        error: 'INVALID_TOKEN',
      });
    }

    // 3. Check if already verified
    if (verification.verifiedAt) {
      this.logger.warn(
        `Verification failed: Email already verified for user ${verification.userId}`,
      );
      throw new RpcException({
        statusCode: 409,
        status: 409,
        message: 'Email is already verified',
        error: 'ALREADY_VERIFIED',
      });
    }

    // 4. Check if token expired
    if (verification.expiresAt < new Date()) {
      this.logger.warn(`Verification failed: Token expired`);
      throw new RpcException({
        statusCode: 400,
        status: 400,
        message: 'Verification token is invalid or expired',
        error: 'INVALID_TOKEN',
      });
    }

    // 5. Update user and verification record transactionally
    await this.authRepository.verifyUserEmail(
      verification.userId,
      verification.id,
    );

    this.logger.log(
      `Email verified successfully for user: ${verification.userId}`,
    );

    return {
      success: true,
      data: {
        message: 'Email verified successfully',
        email: verification.user.email,
        canLogin: true,
      },
    };
  }

  /**
   * Login user with email and password
   * @param dto Login request data
   * @param deviceIp Client IP address
   * @param deviceUserAgent Client user agent
   * @returns Login response with tokens and user info
   */
  async login(
    dto: LoginRequestDto,
    deviceIp: string,
    deviceUserAgent: string,
  ): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt for email: ${dto.email}`);
    const email = dto.email.toLowerCase();
    if (this.rateLimitService.isRateLimited(email)) {
      this.logger.warn(`Rate limit exceeded for email: ${email}`);
      throw new RpcException({
        statusCode: 429,
        status: 429,
        message: 'Too many failed login attempts. Try again in 15 minutes.',
        error: 'TOO_MANY_ATTEMPTS',
      });
    }
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      this.logger.warn(`Login failed: User not found for email ${email}`);
      this.rateLimitService.recordFailedAttempt(email);
      throw new RpcException({
        statusCode: 401,
        status: 401,
        message: 'Email or password incorrect',
        error: 'INVALID_CREDENTIALS',
      });
    }
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password for email ${email}`);
      this.rateLimitService.recordFailedAttempt(email);
      throw new RpcException({
        statusCode: 401,
        status: 401,
        message: 'Email or password incorrect',
        error: 'INVALID_CREDENTIALS',
      });
    }
    this.rateLimitService.clearFailedAttempts(email);
    const accessTokenExpiresIn = this.parseExpiration(
      process.env.JWT_EXPIRATION || '15m',
    );
    const refreshTokenExpiresIn = this.parseExpiration(
      process.env.REFRESH_TOKEN_EXPIRATION || '7d',
    );
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        jti: crypto.randomUUID(),
      },
      {
        expiresIn: accessTokenExpiresIn,
      },
    );
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const accessTokenExpiresAt = new Date();
    accessTokenExpiresAt.setSeconds(
      accessTokenExpiresAt.getSeconds() + accessTokenExpiresIn,
    );
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setSeconds(
      refreshTokenExpiresAt.getSeconds() + refreshTokenExpiresIn,
    );
    const deviceName = dto.deviceName || 'Unknown Device';

    // AuthRepository handles transaction
    const result = await this.authRepository.createSessionWithToken(
      {
        userId: user.id,
        deviceName,
        deviceIp,
        deviceUserAgent,
      },
      {
        userId: user.id,
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
      },
    );

    this.logger.log(
      `User logged in successfully: ${user.id}, session: ${result.session.id}`,
    );
    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: accessTokenExpiresIn,
        userId: user.id,
        email: user.email,
      },
    };
  }

  async refreshToken(dto: RefreshRequestDto): Promise<RefreshResponseDto> {
    this.logger.log(`Attempting to refresh token...`);

    // 1. Find token in DB
    const tokenRecord = await this.authRepository.findTokenByRefreshToken(
      dto.refreshToken,
    );

    if (!tokenRecord) {
      this.logger.warn(`Refresh failed: Token not found`);
      throw new RpcException({
        statusCode: 401,
        status: 401,
        message: 'Refresh token is invalid or expired',
        error: 'INVALID_REFRESH_TOKEN',
      });
    }

    // 2. Check if revoked
    if (tokenRecord.revokedAt) {
      this.logger.warn(
        `Refresh failed: Token revoked for user ${tokenRecord.userId}`,
      );
      throw new RpcException({
        statusCode: 401,
        status: 401,
        message: 'Refresh token is invalid or expired',
        error: 'INVALID_REFRESH_TOKEN',
      });
    }

    // 3. Check if expired
    if (tokenRecord.refreshTokenExpiresAt < new Date()) {
      this.logger.warn(
        `Refresh failed: Token expired for user ${tokenRecord.userId}`,
      );
      throw new RpcException({
        statusCode: 401,
        status: 401,
        message: 'Refresh token is invalid or expired',
        error: 'INVALID_REFRESH_TOKEN',
      });
    }

    // 4. Generate new access token
    const accessTokenExpiresIn = this.parseExpiration(
      process.env.JWT_EXPIRATION || '15m',
    );
    const accessToken = this.jwtService.sign(
      {
        sub: tokenRecord.user.id,
        email: tokenRecord.user.email,
        name: `${tokenRecord.user.firstName} ${tokenRecord.user.lastName}`,
        jti: crypto.randomUUID(),
      },
      {
        expiresIn: accessTokenExpiresIn,
      },
    );

    const accessTokenExpiresAt = new Date();
    accessTokenExpiresAt.setSeconds(
      accessTokenExpiresAt.getSeconds() + accessTokenExpiresIn,
    );

    // 5. Update token record
    await this.authRepository.updateToken(tokenRecord.id, {
      accessToken,
      accessTokenExpiresAt,
    });

    this.logger.log(
      `Token refreshed successfully for user: ${tokenRecord.userId}`,
    );

    return {
      success: true,
      data: {
        accessToken,
        expiresIn: accessTokenExpiresIn,
      },
    };
  }

  /**
   * Parse expiration string to seconds
   * @param expiration Expiration string (e.g., '15m', '7d', '1h')
   * @returns Expiration in seconds
   */
  private parseExpiration(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = Number.parseInt(expiration.slice(0, -1), 10);
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900;
    }
  }

  async logout(dto: LogoutRequestDto): Promise<LogoutResponseDto> {
    this.logger.log(`Attempting to logout user...`);

    // 1. Find token record by access token
    // We use findFirst because accessToken is not @unique in schema (TEXT type)
    const tokenRecord = await this.authRepository.findTokenByAccessToken(
      dto.accessToken,
    );

    if (!tokenRecord) {
      // If token not found, we effectively treat it as already logged out or invalid
      // But for security we shouldn't reveal too much.
      // However, if we return success, the frontend clears the cookie.
      this.logger.warn(
        `Logout: Token record not found for provided access token`,
      );
      // We return success to let the client clear their side.
      return {
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      };
    }

    // 2. Revoke token
    await this.authRepository.revokeToken(tokenRecord.id);

    this.logger.log(`Logout successful for user: ${tokenRecord.userId}`);

    return {
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    };
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const tokenRecord =
      await this.authRepository.findTokenByAccessToken(accessToken);

    if (!tokenRecord) {
      return false;
    }

    if (tokenRecord.revokedAt) {
      return false;
    }

    return true;
  }

  async forgotPassword(
    dto: ForgotPasswordRequestDto,
  ): Promise<ForgotPasswordResponseDto> {
    this.logger.log(`Received forgot password request for: ${dto.email}`);

    // 1. Check rate limit (3 requests per hour)
    const rateLimitKey = `forgot_password:${dto.email}`;
    if (this.rateLimitService.checkRateLimit(rateLimitKey, 3, 3600)) {
      throw new RpcException({
        statusCode: 429,
        status: 429,
        message: 'Too many requests. Please try again later.',
        error: 'TOO_MANY_REQUESTS',
      });
    }

    // 2. Check if user exists
    const user = await this.authRepository.findUserByEmail(dto.email);

    if (!user) {
      // Security: Don't reveal if user exists or not
      this.logger.log(
        `User not found for email: ${dto.email}. Converting to silent success.`,
      );
      return {
        message: 'If an account exists, a password reset email will be sent',
      };
    }

    // 3. Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // 4. Save to database
    await this.authRepository.createPasswordReset({
      userId: user.id,
      token: token,
      expiresAt: expiresAt,
    });

    // 5. Emit event to Email Service
    this.emailClient.emit('auth.password-reset', {
      email: user.email,
      name: user.firstName,
      token: token,
    });

    this.logger.log(`Password reset token generated for user: ${user.id}`);

    return {
      message: 'If an account exists, a password reset email will be sent',
    };
  }

  /**
   * Reset user password using reset token
   * @param dto Reset password request data
   * @returns Reset password response
   */
  async resetPassword(
    dto: ResetPasswordRequestDto,
  ): Promise<ResetPasswordResponseDto> {
    this.logger.log(
      `Received reset password request for token: ${dto.token.substring(0, 8)}...`,
    );

    // 1. Look up reset token
    const resetRecord = await this.authRepository.findPasswordResetByToken(
      dto.token,
    );

    if (!resetRecord) {
      this.logger.warn(`Reset failed: Invalid or expired token`);
      throw new RpcException({
        statusCode: 400,
        status: 400,
        message: 'Password reset token is invalid or expired',
        error: 'INVALID_TOKEN',
      });
    }

    // 2. Check if already used
    if (resetRecord.usedAt) {
      this.logger.warn(
        `Reset failed: Token already used for user ${resetRecord.userId}`,
      );
      throw new RpcException({
        statusCode: 400,
        status: 400,
        message: 'Password reset token is invalid or expired',
        error: 'INVALID_TOKEN',
      });
    }

    // 3. Check if expired
    if (resetRecord.expiresAt < new Date()) {
      this.logger.warn(
        `Reset failed: Token expired for user ${resetRecord.userId}`,
      );
      throw new RpcException({
        statusCode: 400,
        status: 400,
        message: 'Password reset token is invalid or expired',
        error: 'INVALID_TOKEN',
      });
    }

    // 4. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    // 5. Update password, mark token as used, and revoke all tokens in transaction
    await this.authRepository.resetPassword(
      resetRecord.userId,
      resetRecord.id,
      hashedPassword,
    );

    this.logger.log(
      `Password reset successfully for user: ${resetRecord.userId}. All sessions revoked.`,
    );

    return {
      success: true,
      data: {
        message: 'Password reset successfully. You can now login.',
      },
    };
  }

  async getUserSessions(
    userId: string,
    currentAccessToken: string,
  ): Promise<GetSessionsResponseDto> {
    // 1. Get all sessions for user
    const sessions = await this.authRepository.findSessionsByUserId(userId);

    // 2. Identify current session
    const currentTokenRecord =
      await this.authRepository.findTokenByAccessToken(currentAccessToken);

    const currentSessionId = currentTokenRecord?.sessionId;

    // 3. Filter valid sessions and map to DTO
    const parser = new UAParser();

    const activeSessions: SessionDto[] = sessions
      .filter((session) => {
        const hasActiveToken = session.tokens.some(
          (t) => !t.revokedAt && t.refreshTokenExpiresAt > new Date(),
        );
        return hasActiveToken;
      })
      .map((session) => {
        parser.setUA(session.deviceUserAgent);
        const result = parser.getResult();
        const browserName = result.browser.name
          ? `${result.browser.name} ${result.browser.version || ''}`.trim()
          : 'Unknown Browser';
        const osName = result.os.name
          ? `${result.os.name} ${result.os.version || ''}`.trim()
          : 'Unknown OS';
        const deviceName =
          session.deviceName !== 'Unknown Device'
            ? session.deviceName
            : `${browserName} on ${osName}`;

        return {
          sessionId: session.id,
          device: {
            userAgent: session.deviceUserAgent,
            name: deviceName,
            ip: session.deviceIp,
          },
          lastActivityAt: session.lastActivityAt,
          createdAt: session.createdAt,
          isCurrent: session.id === currentSessionId,
        };
      });

    return {
      success: true,
      data: {
        sessions: activeSessions,
      },
    };
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    currentAccessToken: string,
  ): Promise<RevokeSessionResponseDto> {
    // 1. Validate ownership
    const session = await this.authRepository.findSessionById(sessionId);

    if (!session || session.userId !== userId) {
      throw new RpcException({
        statusCode: 404,
        status: 404,
        message: 'Session not found',
        error: 'Not Found',
      });
    }

    // 2. Check if current session
    const currentTokenRecord =
      await this.authRepository.findTokenByAccessToken(currentAccessToken);

    if (currentTokenRecord?.sessionId === sessionId) {
      throw new RpcException({
        statusCode: 403,
        status: 403,
        message: 'Cannot revoke your current session. Use logout instead.',
        error: 'CANNOT_REVOKE_CURRENT',
      });
    }

    // 3. Revoke all tokens for this session
    await this.authRepository.revokeSessionTokens(sessionId);

    return {
      success: true,
      data: {
        message: 'Session revoked successfully',
      },
    };
  }
}
