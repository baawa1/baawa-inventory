/**
 * Structured Logger Utility
 * Provides consistent logging across the application with proper levels and context
 */

import { envConfig } from '@/lib/config/env-validation';

interface LogContext {
  [key: string]: unknown;
}

interface Logger {
  error(_message: string, _context?: LogContext): void;
  warn(_message: string, _context?: LogContext): void;
  info(_message: string, _context?: LogContext): void;
  debug(_message: string, _context?: LogContext): void;
  auth(_message: string, _context?: LogContext): void;
  session(_message: string, _context?: LogContext): void;
  security(_message: string, _context?: LogContext): void;
  upload(_message: string, _context?: LogContext): void;
}

class StructuredLogger implements Logger {
  private isDevelopment = envConfig.isDevelopment;

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private log(level: string, message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage(level, message, context);

    // In development, use console for better debugging
    if (this.isDevelopment) {
      switch (level) {
        case 'error':
          console.error(formattedMessage);
          break;
        case 'warn':
          console.warn(formattedMessage);
          break;
        case 'debug':
          console.debug(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    } else {
      // In production, you might want to send to a logging service
      // For now, we'll use console but with structured format
      console.log(formattedMessage);
    }
  }

  error(_message: string, _context?: LogContext): void {
    this.log('error', _message, _context);
  }

  warn(_message: string, _context?: LogContext): void {
    this.log('warn', _message, _context);
  }

  info(_message: string, _context?: LogContext): void {
    this.log('info', _message, _context);
  }

  debug(_message: string, _context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', _message, _context);
    }
  }

  auth(_message: string, _context?: LogContext): void {
    this.log('auth', _message, _context);
  }

  session(_message: string, _context?: LogContext): void {
    this.log('session', _message, _context);
  }

  security(_message: string, _context?: LogContext): void {
    this.log('security', _message, _context);
  }

  upload(_message: string, _context?: LogContext): void {
    this.log('upload', _message, _context);
  }
}

// Export singleton instance
export const logger = new StructuredLogger();
