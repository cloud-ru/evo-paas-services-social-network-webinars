import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload, AuthenticatedUser } from '@app/types';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET || 'supersecret',
      });

      // Validate token against Auth Service (check revocation)
      try {
        const isValid = await firstValueFrom(
          this.authClient.send<boolean>('auth.validate', {
            accessToken: token,
          }),
        );
        if (!isValid) {
          this.logger.warn(
            `Token validation failed: Token is revoked or invalid`,
          );
          throw new UnauthorizedException('Token revoked');
        }
      } catch (error) {
        this.logger.error(`Token validation service error: ${String(error)}`);
        throw new UnauthorizedException('Token validation failed');
      }

      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (request as any)['user'] = {
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
      } as AuthenticatedUser;
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Token validation failed: ${error?.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const authorization = (request.headers as any)['authorization'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const [type, token] = authorization?.split(' ') ?? [];
    return type === 'Bearer' ? (token as string) : undefined;
  }
}
