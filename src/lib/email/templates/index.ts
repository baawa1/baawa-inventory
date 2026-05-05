import { EmailTemplate, EmailTemplateType } from '../types';
import {
  welcomeTemplate,
  passwordResetTemplate,
  passwordResetConfirmationTemplate,
  userApprovalTemplate,
  userRejectionTemplate,
  roleChangeTemplate,
  adminDigestTemplate,
  userSuspensionTemplate,
  userReactivationTemplate,
  createReceiptEmailTemplate,
} from './base-templates';

/**
 * Get the appropriate email template based on type and data
 */
export async function getEmailTemplate(
  templateType: EmailTemplateType,
  data: any
): Promise<EmailTemplate> {
  switch (templateType) {
    case 'welcome':
      return welcomeTemplate(data);
    case 'password_reset':
      return passwordResetTemplate(data);
    case 'password_reset_confirmation':
      return passwordResetConfirmationTemplate(data);
    case 'user_approved':
      return userApprovalTemplate(data);
    case 'user_rejected':
      return userRejectionTemplate(data);
    case 'account_locked':
      return userRejectionTemplate(data);
    case 'role_changed':
      return roleChangeTemplate(data);
    case 'admin_digest':
      return adminDigestTemplate(data);
    case 'user_suspension':
      return userSuspensionTemplate(data);
    case 'user_reactivation':
      return userReactivationTemplate(data);
    case 'receipt_email':
      return createReceiptEmailTemplate(data);
    default:
      throw new Error(`Unknown email template type: ${templateType}`);
  }
}

/**
 * Get all available email template types
 */
export function getAvailableTemplateTypes(): EmailTemplateType[] {
  return [
    'welcome',
    'password_reset',
    'password_reset_confirmation',
    'user_approved',
    'user_rejected',
    'admin_digest',
    'account_locked',
    'role_changed',
    'user_suspension',
    'user_reactivation',
    'receipt_email',
  ];
}

/**
 * Validate if template type exists
 */
export function isValidTemplateType(
  templateType: string
): templateType is EmailTemplateType {
  return getAvailableTemplateTypes().includes(
    templateType as EmailTemplateType
  );
}

// Re-export all templates for direct use
export {
  welcomeTemplate,
  passwordResetTemplate,
  passwordResetConfirmationTemplate,
  userApprovalTemplate,
  userRejectionTemplate,
  roleChangeTemplate,
  adminDigestTemplate,
  userSuspensionTemplate,
  userReactivationTemplate,
  createReceiptEmailTemplate,
};
