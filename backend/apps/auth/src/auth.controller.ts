import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import {
  RegisterRequestDto,
  RegisterResponseDto,
  VerifyEmailRequestDto,
  VerifyEmailResponseDto,
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
} from '@app/types';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.health')
  healthCheck() {
    this.logger.log('Received health check request');
    return { status: 'ok', service: 'auth' };
  }

  @MessagePattern('auth.register')
  async register(
    @Payload() dto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    this.logger.log(`Received registration request for email: ${dto.email}`);
    const result = await this.authService.register(dto);
    this.logger.log(
      `User registered successfully: ${result.data?.userId || 'unknown'}`,
    );
    return result;
  }

  @MessagePattern('auth.verify-email')
  async verifyEmail(
    @Payload() dto: VerifyEmailRequestDto,
  ): Promise<VerifyEmailResponseDto> {
    this.logger.log(
      `Received email verification request for token: ${dto.token.substring(0, 8)}...`,
    );
    const result = await this.authService.verifyEmail(dto.token);
    this.logger.log(`Email verified successfully`);
    return result;
  }

  @MessagePattern('auth.login')
  async login(
    @Payload()
    payload: {
      dto: LoginRequestDto;
      deviceIp: string;
      deviceUserAgent: string;
    },
  ): Promise<LoginResponseDto> {
    const { dto, deviceIp, deviceUserAgent } = payload;
    this.logger.log(`Received login request for email: ${dto.email}`);
    const result = await this.authService.login(dto, deviceIp, deviceUserAgent);
    this.logger.log(`User logged in successfully: ${result.data?.userId}`);
    return result;
  }

  @MessagePattern('auth.refresh')
  async refresh(
    @Payload() dto: RefreshRequestDto,
  ): Promise<RefreshResponseDto> {
    this.logger.log(`Received refresh token request`);
    const result = await this.authService.refreshToken(dto);
    this.logger.log(`Token refreshed successfully`);
    return result;
  }

  @MessagePattern('auth.logout')
  async logout(@Payload() dto: LogoutRequestDto): Promise<LogoutResponseDto> {
    this.logger.log(`Received logout request`);
    const result = await this.authService.logout(dto);
    this.logger.log(`User logged out successfully`);
    return result;
  }

  @MessagePattern('auth.forgot-password')
  async forgotPassword(
    @Payload() dto: ForgotPasswordRequestDto,
  ): Promise<ForgotPasswordResponseDto> {
    this.logger.log(`Received forgot password request for: ${dto.email}`);
    const result = await this.authService.forgotPassword(dto);
    this.logger.log(`Forgot password request processed for: ${dto.email}`);
    return result;
  }

  @MessagePattern('auth.reset-password')
  async resetPassword(
    @Payload() dto: ResetPasswordRequestDto,
  ): Promise<ResetPasswordResponseDto> {
    this.logger.log(
      `Received reset password request for token: ${dto.token.substring(0, 8)}...`,
    );
    const result = await this.authService.resetPassword(dto);
    this.logger.log(`Password reset successfully`);
    return result;
  }

  @MessagePattern('auth.validate')
  async validate(
    @Payload() payload: { accessToken: string },
  ): Promise<boolean> {
    return this.authService.validateToken(payload.accessToken);
  }

  @MessagePattern('auth.get-sessions')
  async getSessions(
    @Payload() payload: { userId: string; accessToken: string },
  ): Promise<GetSessionsResponseDto> {
    return this.authService.getUserSessions(
      payload.userId,
      payload.accessToken,
    );
  }

  @MessagePattern('auth.revoke-session')
  async revokeSession(
    @Payload()
    payload: {
      userId: string;
      sessionId: string;
      accessToken: string;
    },
  ): Promise<RevokeSessionResponseDto> {
    return this.authService.revokeSession(
      payload.userId,
      payload.sessionId,
      payload.accessToken,
    );
  }
}
