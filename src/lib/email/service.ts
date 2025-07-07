import {
  EmailProvider,
  EmailOptions,
  EmailServiceConfig,
  EmailTemplateType,
  WelcomeEmailData,
  EmailVerificationData,
  PasswordResetData,
  UserApprovalData,
  AdminNotificationData,
  UserRejectionData,
  RoleChangeData,
  AdminDigestData,
  UserSuspensionData,
  UserReactivationData,
} from "./types";
import { EmailProviderFactory } from "./providers/factory";
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
    this.provider = EmailProviderFactory.createProvider(config);
  }

  /**
   * Send a templated email with type safety
   */
  async sendTemplatedEmail<T extends Record<string, unknown>>(
    templateType: EmailTemplateType,
    to: string | string[],
    templateData: T
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
    recipients: Array<{ email: string; data: Record<string, unknown> }>
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
 * Uses the factory to auto-detect the best available provider
 */
export function createEmailService(): EmailService {
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    process.env.FROM_EMAIL ||
    "noreply@baawa.com";
  const fromName = process.env.RESEND_FROM_NAME || "Baawa Inventory POS";
  const replyToEmail = process.env.REPLY_TO_EMAIL;

  const config = EmailProviderFactory.detectProviderConfig(
    fromEmail,
    fromName,
    replyToEmail
  );
  return new EmailService(config);
}

/**
 * Type-safe helper functions for common email operations
 */
export const emailService = {
  /**
   * Send welcome email to new user
   */
  sendWelcomeEmail: async (to: string, data: WelcomeEmailData) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("welcome", to, data);
  },

  /**
   * Send email verification email
   */
  sendVerificationEmail: async (to: string, data: EmailVerificationData) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("email_verification", to, data);
  },

  /**
   * Send password reset email
   */
  sendPasswordResetEmail: async (to: string, data: PasswordResetData) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("password_reset", to, data);
  },

  /**
   * Send user approval notification
   */
  sendUserApprovalEmail: async (to: string, data: UserApprovalData) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("user_approved", to, data);
  },

  /**
   * Send admin notification for new user
   */
  sendAdminNewUserNotification: async (
    to: string | string[],
    data: AdminNotificationData
  ) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("admin_new_user_pending", to, data);
  },

  /**
   * Send user rejection notification
   */
  sendUserRejectionEmail: async (to: string, data: UserRejectionData) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("user_rejected", to, data);
  },

  /**
   * Send role change notification
   */
  sendRoleChangeEmail: async (to: string, data: RoleChangeData) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("role_changed", to, data);
  },

  /**
   * Send admin digest email
   */
  sendAdminDigestEmail: async (
    to: string | string[],
    data: AdminDigestData
  ) => {
    const service = createEmailService();
    return service.sendTemplatedEmail("admin_digest", to, data);
  },

  /**
   * Send user suspension notification email
   */
  async sendUserSuspensionEmail(
    to: string,
    data: UserSuspensionData
  ): Promise<void> {
    const service = createEmailService();
    const template = await getEmailTemplate("user_suspension", data);
    await service.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  },

  /**
   * Send user reactivation notification email
   */
  async sendUserReactivationEmail(
    to: string,
    data: UserReactivationData
  ): Promise<void> {
    const service = createEmailService();
    const template = await getEmailTemplate("user_reactivation", data);
    await service.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
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
