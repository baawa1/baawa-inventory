/**
 * Error Sanitization Utility
 * Prevents sensitive information from being logged or exposed
 */

import { logger } from '../logger';

// List of sensitive fields that should never be logged
const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'token',
  'secret',
  'key',
  'credential',
  'authorization',
  'cookie',
  'session',
  'resetToken',
  'emailVerificationToken',
  'csrf',
  'api_key',
  'private_key',
  'access_token',
  'refresh_token',
];

// Patterns that indicate sensitive data
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /credential/i,
  /authorization/i,
  /bearer/i,
  /jwt/i,
  /session/i,
  /cookie/i,
];

export interface SanitizedError {
  message: string;
  code?: string;
  type: string;
  timestamp: string;
  sanitized: boolean;
}

export class ErrorSanitizer {
  /**
   * Sanitize an error object for safe logging
   */
  static sanitizeError(error: any, _context?: string): SanitizedError {
    const timestamp = new Date().toISOString();

    // Handle different error types
    if (error instanceof Error) {
      return {
        message: this.sanitizeMessage(error.message),
        code: (error as any).code,
        type: error.constructor.name,
        timestamp,
        sanitized: true,
      };
    }

    if (typeof error === 'string') {
      return {
        message: this.sanitizeMessage(error),
        type: 'StringError',
        timestamp,
        sanitized: true,
      };
    }

    if (typeof error === 'object' && error !== null) {
      return {
        message: this.sanitizeMessage(
          JSON.stringify(this.sanitizeObject(error))
        ),
        type: 'ObjectError',
        timestamp,
        sanitized: true,
      };
    }

    return {
      message: 'Unknown error occurred',
      type: 'UnknownError',
      timestamp,
      sanitized: true,
    };
  }

  /**
   * Sanitize error message to remove sensitive information
   */
  private static sanitizeMessage(message: string): string {
    let sanitized = message;

    // Remove common sensitive patterns
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    // Remove potential tokens or keys (long alphanumeric strings)
    sanitized = sanitized.replace(/[a-zA-Z0-9]{32,}/g, '[REDACTED_TOKEN]');

    // Remove email addresses in error messages
    sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[REDACTED_EMAIL]');

    // Remove potential IP addresses
    sanitized = sanitized.replace(
      /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      '[REDACTED_IP]'
    );

    return sanitized;
  }

  /**
   * Sanitize object by removing sensitive fields
   */
  private static sanitizeObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check if field name is sensitive
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else if (typeof value === 'string' && this.isSensitiveValue(value)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if field name is sensitive
   */
  private static isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return SENSITIVE_FIELDS.some(sensitive =>
      lowerField.includes(sensitive.toLowerCase())
    );
  }

  /**
   * Check if value appears to be sensitive
   */
  private static isSensitiveValue(value: string): boolean {
    // Check for JWT tokens
    if (value.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/)) {
      return true;
    }

    // Check for long alphanumeric strings (potential tokens)
    if (value.length > 32 && /^[a-zA-Z0-9]+$/.test(value)) {
      return true;
    }

    // Check for bearer tokens
    if (value.toLowerCase().startsWith('bearer ')) {
      return true;
    }

    return false;
  }

  /**
   * Safe logging method that automatically sanitizes errors
   */
  static logError(error: any, context?: string, additionalData?: any): void {
    const sanitizedError = this.sanitizeError(error, context);
    const sanitizedData = additionalData
      ? this.sanitizeObject(additionalData)
      : undefined;

    logger.error(context || 'Error occurred', {
      error: sanitizedError,
      ...sanitizedData,
    });
  }

  /**
   * Safe logging for authentication errors
   */
  static logAuthError(error: any, email?: string, additionalData?: any): void {
    const sanitizedError = this.sanitizeError(error);
    const sanitizedData = additionalData
      ? this.sanitizeObject(additionalData)
      : undefined;

    logger.error('Authentication error', {
      error: sanitizedError,
      email: email ? this.sanitizeEmail(email) : undefined,
      ...sanitizedData,
    });
  }

  /**
   * Sanitize email for logging (show domain but hide username)
   */
  private static sanitizeEmail(email: string): string {
    if (!email.includes('@')) return '[INVALID_EMAIL]';

    const [username, domain] = email.split('@');
    const sanitizedUsername =
      username.length > 2 ? username.substring(0, 2) + '***' : '***';

    return `${sanitizedUsername}@${domain}`;
  }
}
