import { Injectable, Logger } from '@nestjs/common';

/**
 * Interface for tracking failed login attempts
 */
interface FailedAttempt {
  count: number;
  firstAttemptAt: Date;
}

/**
 * In-memory rate limiting service for login attempts
 * Tracks failed login attempts per email address
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly failedAttempts = new Map<string, FailedAttempt>();
  private readonly genericRateLimits = new Map<string, number[]>();
  private readonly maxAttempts = 5;
  private readonly windowMinutes = 15;

  /**
   * Check if email is rate limited
   * @param email User email address
   * @returns true if rate limited, false otherwise
   */
  isRateLimited(email: string): boolean {
    const attempt = this.failedAttempts.get(email);
    if (!attempt) {
      return false;
    }
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - this.windowMinutes);
    if (attempt.firstAttemptAt < windowStart) {
      this.failedAttempts.delete(email);
      return false;
    }
    if (attempt.count >= this.maxAttempts) {
      this.logger.warn(
        `Rate limit exceeded for email: ${email} (${attempt.count} attempts)`,
      );
      return true;
    }
    return false;
  }

  /**
   * Record a failed login attempt
   * @param email User email address
   */
  recordFailedAttempt(email: string): void {
    const existing = this.failedAttempts.get(email);
    if (existing) {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - this.windowMinutes);
      if (existing.firstAttemptAt < windowStart) {
        this.failedAttempts.set(email, {
          count: 1,
          firstAttemptAt: new Date(),
        });
      } else {
        existing.count += 1;
      }
    } else {
      this.failedAttempts.set(email, {
        count: 1,
        firstAttemptAt: new Date(),
      });
    }
    this.logger.log(
      `Failed login attempt recorded for ${email}: ${this.failedAttempts.get(email)?.count || 0} attempts`,
    );
  }

  /**
   * Clear failed attempts for email (called on successful login)
   * @param email User email address
   */
  clearFailedAttempts(email: string): void {
    if (this.failedAttempts.has(email)) {
      this.failedAttempts.delete(email);
      this.logger.log(`Cleared failed login attempts for ${email}`);
    }
  }

  /**
   * Generic rate limiter
   * @param key Unique key for the action (e.g., "forgot_password:email@example.com")
   * @param limit Maximum number of requests allowed
   * @param windowSeconds Time window in seconds
   * @returns true if rate limited, false otherwise
   */
  checkRateLimit(key: string, limit: number, windowSeconds: number): boolean {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    const timestamps = this.genericRateLimits.get(key) || [];
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length >= limit) {
      this.logger.warn(
        `Rate limit exceeded for key: ${key} (${validTimestamps.length} attempts)`,
      );
      return true;
    }

    validTimestamps.push(now);
    this.genericRateLimits.set(key, validTimestamps);
    return false;
  }
}
