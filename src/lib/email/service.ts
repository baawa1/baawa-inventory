import {
  EmailProvider,
  EmailOptions,
  EmailServiceConfig,
  EmailTemplateType,
  EmailTemplateData,
} from "./types";
import { ResendProvider } from "./providers/resend";
import { NodemailerProvider } from "./providers/nodemailer";
import { getEmailTemplate } from "./templates";

/**
 * Main Email Service
 * Orchestrates email sending across different providers and templates
 */
export class EmailService {
  private provider: EmailProvider;
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.provider = this.createProvider();
  }

  private createProvider(): EmailProvider {
    switch (this.config.provider) {
      case "resend":
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
          throw new Error("RESEND_API_KEY environment variable is required");
        }
        return new ResendProvider(
          resendApiKey,
          this.config.fromEmail,
          this.config.fromName
        );

      case "nodemailer":
        const smtpConfig = {
          host: process.env.SMTP_HOST || "",
          port: parseInt(process.env.SMTP_PORT || "587"),
          user: process.env.SMTP_USER || "",
          pass: process.env.SMTP_PASS || "",
          fromEmail: this.config.fromEmail,
          fromName: this.config.fromName,
        };
        return new NodemailerProvider(smtpConfig);

      default:
        throw new Error(`Unsupported email provider: ${this.config.provider}`);
    }
  }

  /**
   * Send a templated email
   */
  async sendTemplatedEmail(
    templateType: EmailTemplateType,
    to: string | string[],
    templateData: EmailTemplateData
  ): Promise<void> {
    try {
      const template = await getEmailTemplate(templateType, templateData);

      const emailOptions: EmailOptions = {
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      await this.provider.sendEmail(emailOptions);
    } catch (error) {
      console.error(`Failed to send ${templateType} email:`, error);
      throw error;
    }
  }

  /**
   * Send a custom email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    return this.provider.sendEmail(options);
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails: EmailOptions[]): Promise<void> {
    return this.provider.sendBulkEmails(emails);
  }

  /**
   * Send bulk templated emails
   */
  async sendBulkTemplatedEmails(
    templateType: EmailTemplateType,
    recipients: Array<{ email: string; data: EmailTemplateData }>
  ): Promise<void> {
    try {
      const emails: EmailOptions[] = await Promise.all(
        recipients.map(async (recipient) => {
          const template = await getEmailTemplate(templateType, recipient.data);
          return {
            to: recipient.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          };
        })
      );

      await this.provider.sendBulkEmails(emails);
    } catch (error) {
      console.error(`Failed to send bulk ${templateType} emails:`, error);
      throw error;
    }
  }

  /**
   * Validate the email service configuration
   */
  async validateConfig(): Promise<boolean> {
    return this.provider.validateConfig();
  }

  /**
   * Get the current provider name
   */
  getProviderName(): string {
    return this.provider.getProviderName();
  }
}

/**
 * Create and return a configured email service instance
 */
export function createEmailService(): EmailService {
  // Determine which provider to use based on environment
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const hasSmtpConfig = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  let provider: "resend" | "nodemailer";

  // Prefer Resend if available, fall back to nodemailer
  if (hasResendKey) {
    provider = "resend";
  } else if (hasSmtpConfig) {
    provider = "nodemailer";
  } else {
    throw new Error(
      "No email provider configured. Set either RESEND_API_KEY or SMTP credentials."
    );
  }

  const config: EmailServiceConfig = {
    provider,
    fromEmail:
      process.env.RESEND_FROM_EMAIL ||
      process.env.FROM_EMAIL ||
      "noreply@baawa.com",
    fromName: process.env.RESEND_FROM_NAME || "Baawa Inventory POS",
    replyToEmail: process.env.REPLY_TO_EMAIL,
  };

  return new EmailService(config);
}

/**
 * Quick helper functions for common email operations
 */
export const emailService = {
  /**
   * Send welcome email to new user
   */
  sendWelcomeEmail: async (
    to: string,
    data: { firstName: string; email: string; companyName?: string }
  ) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("welcome", to, data);
  },

  /**
   * Send email verification email
   */
  sendVerificationEmail: async (
    to: string,
    data: {
      firstName: string;
      verificationLink: string;
      expiresInHours: number;
    }
  ) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("email_verification", to, data);
  },

  /**
   * Send password reset email
   */
  sendPasswordResetEmail: async (
    to: string,
    data: { firstName: string; resetLink: string; expiresInHours: number }
  ) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("password_reset", to, data);
  },

  /**
   * Send user approval notification
   */
  sendUserApprovalEmail: async (
    to: string,
    data: {
      firstName: string;
      adminName: string;
      dashboardLink: string;
      role: string;
    }
  ) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("user_approved", to, data);
  },

  /**
   * Send admin notification for new user
   */
  sendAdminNewUserNotification: async (
    to: string | string[],
    data: {
      userFirstName: string;
      userLastName: string;
      userEmail: string;
      userCompany?: string;
      approvalLink: string;
      registrationDate: string;
    }
  ) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("admin_new_user_pending", to, data);
  },

  /**
   * Send user rejection notification
   */
  sendUserRejectionEmail: async (
    to: string,
    data: {
      firstName: string;
      adminName: string;
      rejectionReason?: string;
      supportEmail: string;
    }
  ) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("user_rejected", to, data);
  },

  /**
   * Send role change notification
   */
  sendRoleChangeEmail: async (
    to: string,
    data: {
      firstName: string;
      oldRole: string;
      newRole: string;
      changedBy: string;
      dashboardLink: string;
    }
  ) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("role_changed", to, data);
  },

  /**
   * Send admin digest email
   */
  sendAdminDigestEmail: async (
    to: string | string[],
    data: {
      adminName: string;
      newUsersCount: number;
      pendingUsersCount: number;
      newUsers: Array<{
        firstName: string;
        lastName: string;
        email: string;
        registrationDate: string;
        status: string;
      }>;
      dashboardLink: string;
      digestPeriod: string;
    }
  ) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("admin_digest", to, data);
  },
};

/**
 * Utility functions for test emails
 */
export const emailTestUtils = {
  /**
   * Generate a baawapay test email with a specific suffix
   */
  generateTestEmail: (suffix?: string): string => {
    const timestamp = Date.now().toString().slice(-6);
    const finalSuffix = suffix || `test-${timestamp}`;
    return `baawapay+${finalSuffix}@gmail.com`;
  },

  /**
   * Get test email for specific purposes
   */
  getTestEmailFor: (
    purpose:
      | "verification"
      | "password-reset"
      | "approval"
      | "welcome"
      | "general"
  ): string => {
    const timestamp = Date.now().toString().slice(-4);
    return `baawapay+${purpose}-${timestamp}@gmail.com`;
  },

  /**
   * Override email address for development/testing
   * In development, redirects emails to baawapay test addresses
   */
  getEmailAddress: (originalEmail: string, testPurpose?: string): string => {
    const isDevelopment = process.env.NODE_ENV === "development";
    const forceTestEmail = process.env.FORCE_TEST_EMAIL === "true";

    if (isDevelopment || forceTestEmail) {
      const purpose = testPurpose || "dev";
      return emailTestUtils.getTestEmailFor(purpose as any);
    }

    return originalEmail;
  },

  /**
   * Send a test email to verify setup
   */
  sendTestEmail: async (purpose: string = "setup-test"): Promise<void> => {
    const service = createEmailService();
    const testEmail = emailTestUtils.getTestEmailFor("general");

    await service.sendEmail({
      to: testEmail,
      subject: `Test Email - ${purpose} - Baawa Inventory POS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Email System Test</h2>
          <p>This is a test email for: <strong>${purpose}</strong></p>
          <p>If you received this email, the email system is working correctly!</p>
          <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Purpose: ${purpose}</li>
              <li>Provider: ${service.getProviderName()}</li>
              <li>Timestamp: ${new Date().toISOString()}</li>
              <li>Test Email: ${testEmail}</li>
            </ul>
          </div>
        </div>
      `,
      text: `Email System Test\n\nPurpose: ${purpose}\nProvider: ${service.getProviderName()}\nTimestamp: ${new Date().toISOString()}`,
    });
  },
};
