import * as nodemailer from 'nodemailer';
import { EmailProvider, EmailOptions } from '../types';
import { logger } from '@/lib/logger';

/**
 * Nodemailer Email Provider
 * Development and fallback email service using SMTP
 */
export class NodemailerProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;

  constructor(config: {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
  }) {
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true for 465, false for other ports
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.join(', ')
            : options.cc
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.join(', ')
            : options.bcc
          : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments?.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.type,
        })),
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      logger.error('Nodemailer email sending failed', {
        recipient: options.to,
        subject: options.subject,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<void> {
    // Nodemailer doesn't have built-in bulk sending, so we'll send them sequentially
    // In production, you might want to implement batching or rate limiting
    for (const email of emails) {
      await this.sendEmail(email);
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('Nodemailer configuration validation failed', {
        config: this.transporter,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  getProviderName(): string {
    return 'Nodemailer (SMTP)';
  }
}
