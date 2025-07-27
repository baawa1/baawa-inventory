import { EmailTemplate, EmailTemplateType } from '../types';
import {
  welcomeTemplate,
  emailVerificationTemplate,
  passwordResetTemplate,
  passwordResetConfirmationTemplate,
  userApprovalTemplate,
  userRejectionTemplate,
  roleChangeTemplate,
  adminNewUserNotificationTemplate,
  adminDigestTemplate,
  userSuspensionTemplate,
  userReactivationTemplate,
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
    case 'email_verification':
      return emailVerificationTemplate(data);
    case 'password_reset':
      return passwordResetTemplate(data);
    case 'password_reset_confirmation':
      return passwordResetConfirmationTemplate(data);
    case 'user_approved':
      return userApprovalTemplate(data);
    case 'user_rejected':
      return userRejectionTemplate(data);
    case 'admin_new_user_pending':
      return adminNewUserNotificationTemplate(data);
    case 'admin_user_registered':
      return adminNewUserNotificationTemplate(data);
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
    'email_verification',
    'password_reset',
    'password_reset_confirmation',
    'user_approved',
    'user_rejected',
    'admin_new_user_pending',
    'admin_user_registered',
    'admin_digest',
    'account_locked',
    'role_changed',
    'user_suspension',
    'user_reactivation',
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
  emailVerificationTemplate,
  passwordResetTemplate,
  passwordResetConfirmationTemplate,
  userApprovalTemplate,
  userRejectionTemplate,
  roleChangeTemplate,
  adminNewUserNotificationTemplate,
  adminDigestTemplate,
  userSuspensionTemplate,
  userReactivationTemplate,
};
