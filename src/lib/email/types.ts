/**
 * Email Service Interface
 * Defines the contract for all email providers
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  type?: string;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  templateData?: Record<string, any>;
}

export interface EmailProvider {
  /**
   * Send a single email
   */
  sendEmail(options: EmailOptions): Promise<void>;

  /**
   * Send multiple emails (batch)
   */
  sendBulkEmails(emails: EmailOptions[]): Promise<void>;

  /**
   * Validate email configuration
   */
  validateConfig(): Promise<boolean>;

  /**
   * Get provider name for logging/debugging
   */
  getProviderName(): string;
}

export interface EmailServiceConfig {
  provider: "resend" | "nodemailer";
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
}

/**
 * Email Template Types for the application
 */
export type EmailTemplateType =
  | "welcome"
  | "email_verification"
  | "password_reset"
  | "password_reset_confirmation"
  | "user_approved"
  | "user_rejected"
  | "admin_new_user_pending"
  | "admin_user_registered"
  | "admin_digest"
  | "account_locked"
  | "role_changed";

/**
 * Template data interfaces for type safety
 */
export interface WelcomeEmailData {
  firstName: string;
  email: string;
  companyName?: string;
}

export interface EmailVerificationData {
  firstName: string;
  verificationLink: string;
  expiresInHours: number;
}

export interface PasswordResetData {
  firstName: string;
  resetLink: string;
  expiresInHours: number;
}

export interface UserApprovalData {
  firstName: string;
  adminName: string;
  dashboardLink: string;
  role: string;
}

export interface AdminNotificationData {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userCompany?: string;
  approvalLink: string;
  registrationDate: string;
}

export interface UserRejectionData {
  firstName: string;
  adminName: string;
  rejectionReason?: string;
  supportEmail: string;
}

export interface RoleChangeData {
  firstName: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
  dashboardLink: string;
}

export interface AdminDigestData {
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

/**
 * Union type for all template data
 */
export type EmailTemplateData =
  | WelcomeEmailData
  | EmailVerificationData
  | PasswordResetData
  | UserApprovalData
  | UserRejectionData
  | RoleChangeData
  | AdminNotificationData
  | AdminDigestData
  | UserRejectionData
  | RoleChangeData
  | AdminDigestData
  | Record<string, any>;
