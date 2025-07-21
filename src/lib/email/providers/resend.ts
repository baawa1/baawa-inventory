import { Resend } from "resend";
import { EmailProvider, EmailOptions } from "../types";
import { logger } from "@/lib/logger";

/**
 * Resend Email Provider
 * Modern, developer-friendly email service
 */
export class ResendProvider implements EmailProvider {
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;

  constructor(apiKey: string, fromEmail: string, fromName: string) {
    if (!apiKey) {
      throw new Error("Resend API key is required");
    }
    if (!fromEmail) {
      throw new Error("From email is required");
    }

    this.fromEmail = fromEmail;
    this.fromName = fromName;
    this.resend = new Resend(apiKey);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    await this.sendEmailWithId(options);
  }

  async sendEmailWithId(options: EmailOptions): Promise<string | undefined> {
    try {
      const emailData: any = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
      };

      // Add text version if provided
      if (options.text) {
        emailData.text = options.text;
      }

      // Add CC and BCC if provided
      if (options.cc) {
        emailData.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
      }
      if (options.bcc) {
        emailData.bcc = Array.isArray(options.bcc)
          ? options.bcc
          : [options.bcc];
      }

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        emailData.attachments = options.attachments.map((attachment) => ({
          filename: attachment.filename,
          content: Buffer.isBuffer(attachment.content)
            ? attachment.content
            : Buffer.from(attachment.content),
          contentType: attachment.type,
        }));
      }

      const result = await this.resend.emails.send(emailData);

      if (result.error) {
        throw new Error(`Resend API Error: ${result.error.message}`);
      }
      // Return the email ID if available
      return result.data?.id;
    } catch (error) {
      logger.error("Resend email sending failed", {
        recipient: options.to,
        subject: options.subject,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<void> {
    try {
      const emailPromises = emails.map((email) => this.sendEmail(email));
      await Promise.all(emailPromises);
    } catch (error) {
      logger.error("Resend bulk email sending failed", {
        recipientCount: emails.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      // Test with a simple API call to validate the key
      // Resend doesn't have a dedicated validation endpoint, so we'll check domains
      const result = await this.resend.domains.list();
      return !result.error;
    } catch (error) {
      logger.error("Resend configuration validation failed", {
        config: this.resend, // Assuming 'this.config' is not defined, using 'this.resend' for context
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  getProviderName(): string {
    return "Resend";
  }

  /**
   * Get Resend specific account information
   */
  async getAccountInfo(): Promise<any> {
    try {
      const domains = await this.resend.domains.list();
      return {
        provider: "Resend",
        fromEmail: this.fromEmail,
        fromName: this.fromName,
        domains: domains.data || [],
        hasError: !!domains.error,
      };
    } catch (error) {
      logger.error("Failed to get Resend account information", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
