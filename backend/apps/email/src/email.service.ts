import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRegisteredEvent, PasswordResetEvent } from '@app/types/auth';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private defaultFrom: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const isDevMode = this.configService.get('EMAIL_DEV_MODE') === 'true';
    if (isDevMode) {
      this.logger.log(
        'Email service running in DEV MODE - emails will be logged to console',
      );
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT'),
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASSWORD'),
        },
      });
      this.defaultFrom = this.configService.get<string>('SMTP_FROM') || '';
      this.logger.log('Email transporter initialized with SMTP configuration');
    }
  }

  /**
   * Sends an email using the configured transporter.
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: this.defaultFrom,
      ...options,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(data: UserRegisteredEvent) {
    this.logger.log(
      `Sending welcome email to: ${data.email} (User ID: ${data.userId})`,
    );
    const apiGatewayUrl =
      this.configService.get<string>('API_GATEWAY_URL') ||
      'http://localhost:3000';
    const verificationLink = `${apiGatewayUrl}/auth/verify-email?token=${data.token}`;
    if (this.configService.get('EMAIL_DEV_MODE') === 'true') {
      this.logger.log(
        `[DEV MODE] Check your console. Email to ${data.email} would have been sent.`,
      );
      this.logger.debug(
        `[DEV MODE] Subject: Welcome to Social Network - Verify Your Email\nTo: ${data.email}\nVerification Link: ${verificationLink}`,
      );
      return;
    }
    try {
      await this.sendEmail({
        to: data.email,
        subject: 'Welcome to Social Network - Verify Your Email',
        text: `Welcome ${data.name}!\n\nThank you for registering with Social Network. To complete your registration, please verify your email address by clicking the link below:\n\n${verificationLink}\n\nThis link will expire in 24 hours.\n\nIf you did not create this account, you can safely ignore this email.\n\nBest regards,\nSocial Network Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome ${data.name}!</h2>
            <p>Thank you for registering with Social Network. To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #007bff; word-break: break-all;">${verificationLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
            <p style="color: #999; font-size: 12px;">If you did not create this account, you can safely ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`Email sent successfully to ${data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${data.email}`, error);
    }
  }

  async sendPasswordResetEmail(data: PasswordResetEvent) {
    this.logger.log(
      `Sending password reset email to: ${data.email} (Token: ${data.token})`,
    );
    const apiGatewayUrl =
      this.configService.get<string>('API_GATEWAY_URL') ||
      'http://localhost:3000';
    const resetLink = `${apiGatewayUrl}/auth/reset-password?token=${data.token}`;
    if (this.configService.get('EMAIL_DEV_MODE') === 'true') {
      this.logger.log(
        `[DEV MODE] Check your console. Password Reset Email to ${data.email} would have been sent.`,
      );
      this.logger.debug(
        `[DEV MODE] Subject: Reset Your Password\nTo: ${data.email}\nReset Link: ${resetLink}`,
      );
      return;
    }
    try {
      await this.sendEmail({
        to: data.email,
        subject: 'Reset Your Password',
        text: `Hi ${data.name},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nSocial Network Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>Hi ${data.name},</p>
            <p>You requested a password reset. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #007bff; word-break: break-all;">${resetLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
            <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(
        `Password reset email sent successfully to ${data.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${data.email}`,
        error,
      );
    }
  }
}
