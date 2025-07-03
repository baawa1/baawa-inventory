import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Token security utilities for handling sensitive tokens
 */
export class TokenSecurity {
  /**
   * Generate a secure random token
   * @param length - Length of the token in bytes (default: 32)
   * @returns Object with raw token and hashed version
   */
  static generateSecureToken(length: number = 32): {
    rawToken: string;
    hashedToken: string;
  } {
    const rawToken = crypto.randomBytes(length).toString("hex");
    const hashedToken = bcrypt.hashSync(rawToken, 10);

    return {
      rawToken,
      hashedToken,
    };
  }

  /**
   * Verify a token against its hash
   * @param rawToken - The plain token to verify
   * @param hashedToken - The hashed token to compare against
   * @returns True if tokens match
   */
  static async verifyToken(
    rawToken: string,
    hashedToken: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(rawToken, hashedToken);
    } catch (error) {
      console.error("Token verification failed:", error);
      return false;
    }
  }

  /**
   * Generate a time-based expiry date
   * @param hoursFromNow - Hours from current time for expiry
   * @returns Date object representing expiry time
   */
  static generateExpiry(hoursFromNow: number): Date {
    return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  }

  /**
   * Check if a token has expired
   * @param expiryDate - The expiry date to check against
   * @returns True if expired, false if still valid
   */
  static isTokenExpired(expiryDate: Date | null): boolean {
    if (!expiryDate) return true;
    return new Date() > expiryDate;
  }

  /**
   * Generate email verification token (stores hashed, returns raw for email)
   * @param length - Length of the token in bytes (default: 32)
   * @returns Object with raw token for email and hashed version for database
   */
  static generateEmailVerificationToken(length: number = 32): {
    rawToken: string;
    hashedToken: string;
    expires: Date;
  } {
    const rawToken = crypto.randomBytes(length).toString("hex");
    const hashedToken = bcrypt.hashSync(rawToken, 10);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      rawToken,
      hashedToken,
      expires,
    };
  }

  /**
   * Verify email verification token against its hash
   * @param rawToken - The plain token from email link
   * @param hashedToken - The hashed token from database
   * @returns True if tokens match
   */
  static async verifyEmailToken(
    rawToken: string,
    hashedToken: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(rawToken, hashedToken);
    } catch (error) {
      console.error("Email token verification failed:", error);
      return false;
    }
  }
}
