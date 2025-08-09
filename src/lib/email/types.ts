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
  templateData?: Record<string, unknown>;
}

export interface EmailProvider {
  /**
   * Send a single email
   */
  sendEmail(_options: EmailOptions): Promise<void>;

  /**
   * Optionally send a single email and return the provider email ID (for E2E)
   */
  sendEmailWithId?(_options: EmailOptions): Promise<string | undefined>;

  /**
   * Send multiple emails (batch)
   */
  sendBulkEmails(_emails: EmailOptions[]): Promise<void>;

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
  provider: 'resend' | 'nodemailer';
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
}

/**
 * Email Template Types for the application
 */
export type EmailTemplateType =
  | 'welcome'
  | 'email_verification'
  | 'password_reset'
  | 'password_reset_confirmation'
  | 'user_approved'
  | 'user_rejected'
  | 'admin_new_user_pending'
  | 'admin_user_registered'
  | 'admin_digest'
  | 'account_locked'
  | 'role_changed'
  | 'user_suspension'
  | 'user_reactivation'
  | 'receipt_email';

/**
 * Template data interfaces for type safety
 */
export interface WelcomeEmailData extends Record<string, unknown> {
  firstName: string;
  email: string;
  companyName?: string;
}

export interface EmailVerificationData extends Record<string, unknown> {
  firstName: string;
  verificationLink: string;
  expiresInHours: number;
}

export interface PasswordResetData extends Record<string, unknown> {
  firstName: string;
  resetLink: string;
  expiresInHours: number;
}

export interface UserApprovalData extends Record<string, unknown> {
  firstName: string;
  adminName: string;
  dashboardLink: string;
  role: string;
}

export interface AdminNotificationData extends Record<string, unknown> {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userCompany?: string;
  approvalLink: string;
  registrationDate: string;
}

export interface UserRejectionData extends Record<string, unknown> {
  firstName: string;
  adminName: string;
  rejectionReason?: string;
  supportEmail: string;
}

export interface RoleChangeData extends Record<string, unknown> {
  firstName: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
  dashboardLink: string;
}

export interface AdminDigestData extends Record<string, unknown> {
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

export interface UserSuspensionData extends Record<string, unknown> {
  firstName: string;
  lastName: string;
  reason: string;
  supportEmail?: string;
}

export interface UserReactivationData extends Record<string, unknown> {
  firstName: string;
  lastName: string;
  loginLink?: string;
}

export interface ReceiptEmailData extends Record<string, unknown> {
  customerName: string;
  saleId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  fees?: Array<{
    type: string;
    description?: string;
    amount: number;
  }>;
  total: number;
  paymentMethod: string;
  timestamp: Date;
  staffName: string;
  notes?: string | null;
}

/**
 * Union type for all template data with proper mapping
 */
export type EmailTemplateData = {
  welcome: WelcomeEmailData;
  email_verification: EmailVerificationData;
  password_reset: PasswordResetData;
  password_reset_confirmation: PasswordResetData;
  user_approved: UserApprovalData;
  user_rejected: UserRejectionData;
  admin_new_user_pending: AdminNotificationData;
  admin_user_registered: AdminNotificationData;
  admin_digest: AdminDigestData;
  account_locked: UserSuspensionData;
  role_changed: RoleChangeData;
  user_suspension: UserSuspensionData;
  user_reactivation: UserReactivationData;
  receipt_email: ReceiptEmailData;
};
