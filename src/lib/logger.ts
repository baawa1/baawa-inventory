/**
 * Structured logging utility for consistent logging across the application
 */

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    if (this.isProduction && level !== LogLevel.DEBUG) return true;
    return false;
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  // Special method for authentication events
  auth(message: string, context?: LogContext): void {
    const authContext = { ...context, category: "authentication" };
    this.info(message, authContext);
  }

  // Special method for session events
  session(message: string, context?: LogContext): void {
    const sessionContext = { ...context, category: "session" };
    this.info(message, sessionContext);
  }

  // Special method for security events
  security(message: string, context?: LogContext): void {
    const securityContext = { ...context, category: "security" };
    this.warn(message, securityContext);
  }
}

export const logger = new Logger();
