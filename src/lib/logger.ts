/**
 * Structured Logger Utility
 * Provides consistent logging across the application with proper levels and context
 */

interface LogContext {
  [key: string]: unknown;
}

interface Logger {
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  auth(message: string, context?: LogContext): void;
  session(message: string, context?: LogContext): void;
  security(message: string, context?: LogContext): void;
  upload(message: string, context?: LogContext): void;
}

class StructuredLogger implements Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private log(level: string, message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage(level, message, context);

    // In development, use console for better debugging
    if (this.isDevelopment) {
      switch (level) {
        case "error":
          console.error(formattedMessage);
          break;
        case "warn":
          console.warn(formattedMessage);
          break;
        case "debug":
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

  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log("debug", message, context);
    }
  }

  auth(message: string, context?: LogContext): void {
    this.log("auth", message, context);
  }

  session(message: string, context?: LogContext): void {
    this.log("session", message, context);
  }

  security(message: string, context?: LogContext): void {
    this.log("security", message, context);
  }

  upload(message: string, context?: LogContext): void {
    this.log("upload", message, context);
  }
}

// Export singleton instance
export const logger = new StructuredLogger();
