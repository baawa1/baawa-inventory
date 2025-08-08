/**
 * Script Logger Adapter
 * CommonJS version of the structured logger for use in Node.js scripts
 * Follows the same interface as src/lib/logger.ts
 */

class ScriptLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  log(level, message, context = {}) {
    const formattedMessage = this.formatMessage(level, message, context);
    
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
      // In production, use structured logging
      console.log(formattedMessage);
    }
  }

  error(message, context = {}) {
    this.log('error', message, context);
  }

  warn(message, context = {}) {
    this.log('warn', message, context);
  }

  info(message, context = {}) {
    this.log('info', message, context);
  }

  debug(message, context = {}) {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  auth(message, context = {}) {
    this.log('auth', message, context);
  }

  session(message, context = {}) {
    this.log('session', message, context);
  }

  security(message, context = {}) {
    this.log('security', message, context);
  }

  upload(message, context = {}) {
    this.log('upload', message, context);
  }
}

// Export singleton instance (same pattern as the TypeScript logger)
module.exports = new ScriptLogger();
