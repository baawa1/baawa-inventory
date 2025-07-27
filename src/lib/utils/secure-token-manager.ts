/**
 * Secure Token Manager
 * Handles hashing and verification of reset and verification tokens
 */

import crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { ErrorSanitizer } from './error-sanitizer';

export interface TokenPair {
  rawToken: string;
  hashedToken: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
}

export class SecureTokenManager {
  private static readonly SALT_ROUNDS = 12;
  private static readonly TOKEN_LENGTH = 32;

  /**
   * Generate a secure token pair (raw token for email, hashed token for database)
   */
  static generateTokenPair(): TokenPair {
    try {
      // Generate cryptographically secure random token
      const rawToken = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');

      // Hash the token for database storage
      const hashedToken = bcrypt.hashSync(rawToken, this.SALT_ROUNDS);

      return {
        rawToken,
        hashedToken,
      };
    } catch (error) {
      ErrorSanitizer.logError(error, 'generateTokenPair');
      throw new Error('Failed to generate secure token');
    }
  }

  /**
   * Verify a raw token against its hashed version
   */
  static async verifyToken(
    rawToken: string,
    hashedToken: string
  ): Promise<TokenValidationResult> {
    try {
      if (!rawToken || !hashedToken) {
        return {
          isValid: false,
          error: 'Missing token or hash',
        };
      }

      const isValid = await bcrypt.compare(rawToken, hashedToken);

      return {
        isValid,
        error: isValid ? undefined : 'Invalid token',
      };
    } catch (error) {
      ErrorSanitizer.logError(error, 'verifyToken');
      return {
        isValid: false,
        error: 'Token verification failed',
      };
    }
  }

  /**
   * Generate token expiration date
   */
  static generateExpiration(hoursFromNow: number): Date {
    return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(expirationDate: Date): boolean {
    return new Date() > expirationDate;
  }

  /**
   * Generate password reset token pair
   */
  static generatePasswordResetToken(): {
    rawToken: string;
    hashedToken: string;
    expiresAt: Date;
  } {
    const tokenPair = this.generateTokenPair();
    const expiresAt = this.generateExpiration(1); // 1 hour expiration

    return {
      rawToken: tokenPair.rawToken,
      hashedToken: tokenPair.hashedToken,
      expiresAt,
    };
  }

  /**
   * Generate email verification token pair
   */
  static generateEmailVerificationToken(): {
    rawToken: string;
    hashedToken: string;
    expiresAt: Date;
  } {
    const tokenPair = this.generateTokenPair();
    const expiresAt = this.generateExpiration(24); // 24 hours expiration

    return {
      rawToken: tokenPair.rawToken,
      hashedToken: tokenPair.hashedToken,
      expiresAt,
    };
  }

  /**
   * Validate token format (basic validation)
   */
  static isValidTokenFormat(token: string): boolean {
    // Check if token is hex string of expected length
    const expectedLength = this.TOKEN_LENGTH * 2; // hex encoding doubles length
    return (
      typeof token === 'string' &&
      token.length === expectedLength &&
      /^[a-f0-9]+$/i.test(token)
    );
  }

  /**
   * Generate secure session ID
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}
