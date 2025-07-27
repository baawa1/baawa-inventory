import { EmailProvider, EmailServiceConfig } from '../types';
import { ResendProvider } from './resend';
import { NodemailerProvider } from './nodemailer';

/**
 * Provider Factory
 * Handles the creation and configuration of email providers
 */
export class EmailProviderFactory {
  /**
   * Create an email provider based on configuration
   */
  static createProvider(config: EmailServiceConfig): EmailProvider {
    switch (config.provider) {
      case 'resend':
        return EmailProviderFactory.createResendProvider(config);
      case 'nodemailer':
        return EmailProviderFactory.createNodemailerProvider(config);
      default:
        throw new Error(`Unsupported email provider: ${config.provider}`);
    }
  }

  /**
   * Create Resend provider with validation
   */
  private static createResendProvider(
    config: EmailServiceConfig
  ): ResendProvider {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    return new ResendProvider(resendApiKey, config.fromEmail, config.fromName);
  }

  /**
   * Create Nodemailer provider with validation
   */
  private static createNodemailerProvider(
    config: EmailServiceConfig
  ): NodemailerProvider {
    const smtpConfig = {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      fromEmail: config.fromEmail,
      fromName: config.fromName,
    };

    // Validate required SMTP configuration
    if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.pass) {
      throw new Error(
        'SMTP configuration is incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS'
      );
    }

    return new NodemailerProvider(smtpConfig);
  }

  /**
   * Auto-detect and create the best available provider
   */
  static createAutoProvider(
    fromEmail: string,
    fromName: string,
    replyToEmail?: string
  ): EmailProvider {
    const config = EmailProviderFactory.detectProviderConfig(
      fromEmail,
      fromName,
      replyToEmail
    );
    return EmailProviderFactory.createProvider(config);
  }

  /**
   * Detect which provider should be used based on environment variables
   */
  static detectProviderConfig(
    fromEmail: string,
    fromName: string,
    replyToEmail?: string
  ): EmailServiceConfig {
    const hasResendKey = !!process.env.RESEND_API_KEY;
    const hasSmtpConfig = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );

    let provider: 'resend' | 'nodemailer';

    // Prefer Resend if available, fall back to nodemailer
    if (hasResendKey) {
      provider = 'resend';
    } else if (hasSmtpConfig) {
      provider = 'nodemailer';
    } else {
      throw new Error(
        'No email provider configured. Set either RESEND_API_KEY or SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS).'
      );
    }

    return {
      provider,
      fromEmail,
      fromName,
      replyToEmail,
    };
  }

  /**
   * Validate provider configuration without creating the provider
   */
  static validateProviderConfig(config: EmailServiceConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate common config
    if (!config.fromEmail) {
      errors.push('fromEmail is required');
    }
    if (!config.fromName) {
      errors.push('fromName is required');
    }

    // Validate provider-specific config
    if (config.provider === 'resend') {
      if (!process.env.RESEND_API_KEY) {
        errors.push(
          'RESEND_API_KEY environment variable is required for Resend provider'
        );
      }
    } else if (config.provider === 'nodemailer') {
      if (!process.env.SMTP_HOST) {
        errors.push(
          'SMTP_HOST environment variable is required for Nodemailer provider'
        );
      }
      if (!process.env.SMTP_USER) {
        errors.push(
          'SMTP_USER environment variable is required for Nodemailer provider'
        );
      }
      if (!process.env.SMTP_PASS) {
        errors.push(
          'SMTP_PASS environment variable is required for Nodemailer provider'
        );
      }
    } else {
      errors.push(`Unsupported provider: ${config.provider}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
