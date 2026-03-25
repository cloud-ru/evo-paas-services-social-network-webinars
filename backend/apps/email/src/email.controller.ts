import { Controller, Logger, Get } from '@nestjs/common';
import { MessagePattern, EventPattern } from '@nestjs/microservices';
import type { UserRegisteredEvent, PasswordResetEvent } from '@app/types/auth';
import { EmailService } from './email.service';

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @Get('health')
  healthCheckHttp() {
    this.logger.log('Received HTTP health check request');
    return { status: 'ok', service: 'email' };
  }

  @MessagePattern('email.health')
  healthCheck() {
    this.logger.log('Received health check request');
    return { status: 'ok', service: 'email' };
  }

  @EventPattern('user.registered')
  async handleUserRegistered(data: UserRegisteredEvent) {
    this.logger.log(`Received user.registered event: ${JSON.stringify(data)}`);
    await this.emailService.sendWelcomeEmail(data);
  }

  @EventPattern('auth.password-reset')
  async handlePasswordReset(data: PasswordResetEvent) {
    this.logger.log(
      `Received auth.password-reset event: ${JSON.stringify(data)}`,
    );
    await this.emailService.sendPasswordResetEmail(data);
  }
}
