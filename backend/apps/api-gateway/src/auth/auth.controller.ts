import {
  Controller,
  Post,
  Body,
  Inject,
  Logger,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Req,
  Res,
  Ip,
  Headers,
  UseGuards,
  Param,
  Delete,
} from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import {
  RegisterRequestDto,
  RegisterResponseDto,
  VerifyEmailRequestDto,
  VerifyEmailResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RefreshRequestDto,
  RefreshResponseDto,
  LogoutResponseDto,
  ForgotPasswordRequestDto,
  ForgotPasswordResponseDto,
  ResetPasswordRequestDto,
  ResetPasswordResponseDto,
  AuthenticatedUser,
  GetSessionsResponseDto,
  RevokeSessionResponseDto,
} from '@app/types';

import { firstValueFrom } from 'rxjs';
import type { Request, Response } from 'express';
import { AuthGuard } from './guards/auth.guard';

interface AuthRequest extends Request {
  user: AuthenticatedUser;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for auth service' })
  @ApiResponse({
    status: 200,
    description: 'Auth service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'auth' },
      },
    },
  })
  async healthCheck(): Promise<{ status: string; service: string }> {
    this.logger.log('Proxying health check request to auth service');
    return firstValueFrom(
      this.authClient.send<{ status: string; service: string }>(
        'auth.health',
        {},
      ),
    );
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account and sends verification email.',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Email already registered' })
  async register(
    @Body() dto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    this.logger.log(`Proxying registration request for: ${dto.email}`);

    try {
      const result = await firstValueFrom(
        this.authClient.send<RegisterResponseDto>('auth.register', dto),
      );

      this.logger.log(
        `Registration successful: ${result?.data?.userId || 'unknown'}`,
      );
      return result;
    } catch (error) {
      this.handleAuthError(error, 'Registration failed');
    }
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify user email address',
    description:
      'Verifies user email using the token sent in the verification email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid token or token expired',
  })
  @ApiConflictResponse({
    description: 'Email is already verified',
  })
  async verifyEmailPost(
    @Body() dto: VerifyEmailRequestDto,
  ): Promise<VerifyEmailResponseDto> {
    this.logger.log(
      `Proxying email verification request (POST): ${dto.token.substring(0, 8)}...`,
    );

    try {
      const result = await firstValueFrom(
        this.authClient.send<VerifyEmailResponseDto>('auth.verify-email', dto),
      );

      this.logger.log(`Email verification successful`);
      return result;
    } catch (error) {
      this.handleAuthError(error, 'Email verification failed');
    }
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Verify user email address via link',
    description:
      'Verifies user email using the token from query parameter (for clicking email links).',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid token or token expired',
  })
  @ApiConflictResponse({
    description: 'Email is already verified',
  })
  async verifyEmailGet(
    @Query('token') token: string,
  ): Promise<VerifyEmailResponseDto> {
    this.logger.log(
      `Proxying email verification request (GET): ${token?.substring(0, 8) || 'missing'}...`,
    );

    if (!token) {
      throw new HttpException(
        {
          statusCode: 400,
          message: 'Verification token is required',
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await firstValueFrom(
        this.authClient.send<VerifyEmailResponseDto>('auth.verify-email', {
          token,
        }),
      );

      this.logger.log(`Email verification successful`);
      return result;
    } catch (error) {
      this.handleAuthError(error, 'Email verification failed');
    }
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates user with email and password, returns JWT access token and refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiTooManyRequestsResponse({
    description: 'Too many failed login attempts',
  })
  async login(
    @Body() dto: LoginRequestDto,
    @Ip() deviceIp: string,
    @Headers('user-agent') deviceUserAgent: string = 'unknown',
  ): Promise<LoginResponseDto> {
    this.logger.log(`Proxying login request for: ${dto.email}`);
    try {
      const result = await firstValueFrom(
        this.authClient.send<LoginResponseDto>('auth.login', {
          dto,
          deviceIp,
          deviceUserAgent,
        }),
      );
      this.logger.log(`Login successful: ${result?.data?.userId || 'unknown'}`);
      return result;
    } catch (error) {
      this.handleAuthError(error, 'Login failed');
    }
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generates a new access token using a valid refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshRequestDto): Promise<RefreshResponseDto> {
    this.logger.log(`Proxying refresh token request`);

    const refreshToken = dto.refreshToken;

    if (!refreshToken) {
      throw new HttpException(
        {
          statusCode: 401,
          message: 'Refresh token is required',
          error: 'Unauthorized',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const result = await firstValueFrom(
        this.authClient.send<RefreshResponseDto>('auth.refresh', {
          refreshToken,
        }),
      );
      this.logger.log(`Token refresh successful`);
      return result;
    } catch (error) {
      this.handleAuthError(error, 'Token refresh failed');
    }
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Logs out the user, invalidates tokens, and clears session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    type: LogoutResponseDto,
  })
  async logout(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<LogoutResponseDto> {
    this.logger.log(`Proxying logout request`);

    const authHeader = req.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new HttpException(
        {
          statusCode: 401,
          message: 'Authorization header missing',
          error: 'Unauthorized',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const accessToken = authHeader.split(' ')[1];

    try {
      const result = await firstValueFrom(
        this.authClient.send<LogoutResponseDto>('auth.logout', {
          accessToken,
        }),
      );

      // Clear refresh token cookie
      res.clearCookie('refresh_token');

      this.logger.log(`Logout successful`);
      return result;
    } catch (error) {
      this.handleAuthError(error, 'Logout failed');
    }
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends a password reset email to the user if the account exists.',
  })
  @ApiResponse({
    status: 200,
    description: 'Request processed successfully',
    type: ForgotPasswordResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests. Try again later.',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordRequestDto,
  ): Promise<ForgotPasswordResponseDto> {
    this.logger.log(`Proxying forgot password request for: ${dto.email}`);

    try {
      const result = await firstValueFrom(
        this.authClient.send<ForgotPasswordResponseDto>(
          'auth.forgot-password',
          dto,
        ),
      );
      this.logger.log(`Forgot password request processed`);
      return result;
    } catch (error) {
      this.handleAuthError(error, 'Forgot password request failed');
    }
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description:
      'Resets user password using the token from email. All existing sessions will be invalidated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    type: ResetPasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired token, or weak password',
  })
  async resetPassword(
    @Body() dto: ResetPasswordRequestDto,
  ): Promise<ResetPasswordResponseDto> {
    this.logger.log(
      `Proxying reset password request for token: ${dto.token.substring(0, 8)}...`,
    );

    try {
      const result = await firstValueFrom(
        this.authClient.send<ResetPasswordResponseDto>(
          'auth.reset-password',
          dto,
        ),
      );
      this.logger.log(`Password reset successful`);
      return result;
    } catch (error) {
      this.handleAuthError(error, 'Reset password request failed');
    }
  }

  @UseGuards(AuthGuard)
  @Get('sessions')
  @ApiOperation({ summary: 'List all active sessions' })
  @ApiResponse({
    status: 200,
    description: 'Sessions retrieved successfully',
    type: GetSessionsResponseDto,
  })
  async getSessions(@Req() req: Request): Promise<GetSessionsResponseDto> {
    const user = (req as AuthRequest).user;
    const accessToken = req.headers['authorization']?.split(' ')[1] || '';

    this.logger.log(`Listing sessions for user: ${user.userId}`);

    try {
      const result = await firstValueFrom(
        this.authClient.send<GetSessionsResponseDto>('auth.get-sessions', {
          userId: user.userId,
          accessToken,
        }),
      );
      return result;
    } catch (error) {
      this.handleAuthError(error, 'Get sessions failed');
    }
  }

  @UseGuards(AuthGuard)
  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Revoke a session' })
  @ApiResponse({
    status: 200,
    description: 'Session revoked successfully',
    type: RevokeSessionResponseDto,
  })
  async revokeSession(
    @Req() req: Request,
    @Param('sessionId') sessionId: string,
  ): Promise<RevokeSessionResponseDto> {
    const user = (req as AuthRequest).user;
    const accessToken = req.headers['authorization']?.split(' ')[1] || '';

    this.logger.log(`Revoking session ${sessionId} for user: ${user.userId}`);

    try {
      const result = await firstValueFrom(
        this.authClient.send<RevokeSessionResponseDto>('auth.revoke-session', {
          userId: user.userId,
          sessionId,
          accessToken,
        }),
      );
      return result;
    } catch (error) {
      this.handleAuthError(error, 'Revoke session failed');
    }
  }

  private handleAuthError(error: unknown, defaultMessage: string): never {
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
