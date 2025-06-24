import { EmailTemplate, EmailTemplateType, EmailTemplateData } from "../types";
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
} from "./base-templates";

/**
 * Get the appropriate email template based on type and data
 */
export async function getEmailTemplate(
  templateType: EmailTemplateType,
  data: EmailTemplateData
): Promise<EmailTemplate> {
  switch (templateType) {
    case "welcome":
      return welcomeTemplate(
        data as { firstName: string; email: string; companyName?: string }
      );

    case "email_verification":
      return emailVerificationTemplate(
        data as {
          firstName: string;
          verificationLink: string;
          expiresInHours: number;
        }
      );

    case "password_reset":
      return passwordResetTemplate(
        data as {
          firstName: string;
          resetLink: string;
          expiresInHours: number;
        }
      );

    case "password_reset_confirmation":
      return passwordResetConfirmationTemplate(data as { firstName: string });

    case "user_approved":
      return userApprovalTemplate(
        data as {
          firstName: string;
          adminName: string;
          dashboardLink: string;
          role: string;
        }
      );

    case "user_rejected":
      return userRejectionTemplate(
        data as {
          firstName: string;
          adminName: string;
          rejectionReason?: string;
          supportEmail: string;
        }
      );

    case "admin_new_user_pending":
      return adminNewUserNotificationTemplate(
        data as {
          userFirstName: string;
          userLastName: string;
          userEmail: string;
          userCompany?: string;
          approvalLink: string;
          registrationDate: string;
        }
      );

    case "admin_user_registered":
      return getAdminUserRegisteredTemplate(
        data as {
          userFirstName: string;
          userLastName: string;
          userEmail: string;
          userCompany?: string;
          registrationDate: string;
        }
      );

    case "account_locked":
      return getAccountLockedTemplate(
        data as { firstName: string; reason: string }
      );

    case "role_changed":
      return roleChangeTemplate(
        data as {
          firstName: string;
          oldRole: string;
          newRole: string;
          changedBy: string;
          dashboardLink: string;
        }
      );

    case "admin_digest":
      return adminDigestTemplate(
        data as {
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
      );

    default:
      throw new Error(`Unknown email template type: ${templateType}`);
  }
}

/**
 * Additional template functions for less common email types
 */

function getUserRejectedTemplate(data: {
  firstName: string;
  reason?: string;
}): EmailTemplate {
  const content = `
    <h1 class="title">Account Application Update</h1>
    <div class="content">
        <p>Hi ${data.firstName},</p>
        <p>Thank you for your interest in Baawa Inventory POS. After reviewing your application, we're unable to approve your account at this time.</p>
        
        ${
          data.reason
            ? `
        <div class="info">
            <p><strong>Reason:</strong> ${data.reason}</p>
        </div>
        `
            : ""
        }
        
        <p>If you believe this is an error or would like to discuss your application, please contact our support team.</p>
        <p>Best regards,<br>The Baawa Team</p>
    </div>
  `;

  return {
    subject: "Account Application Update - Baawa Inventory POS",
    html: createBaseTemplate(content, "Account Application Update"),
    text: `Hi ${
      data.firstName
    },\n\nYour account application could not be approved at this time.${
      data.reason ? `\n\nReason: ${data.reason}` : ""
    }\n\nContact support if you have questions.\n\nBest regards,\nThe Baawa Team`,
  };
}

function getAdminUserRegisteredTemplate(data: {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userCompany?: string;
  registrationDate: string;
}): EmailTemplate {
  const content = `
    <h1 class="title">New User Registration 📝</h1>
    <div class="content">
        <p>Hello Admin,</p>
        <p>A new user has successfully registered for Baawa Inventory POS.</p>
        
        <div class="info">
            <p><strong>User Details:</strong></p>
            <ul>
                <li>Name: <span class="highlight">${data.userFirstName} ${
                  data.userLastName
                }</span></li>
                <li>Email: <span class="highlight">${data.userEmail}</span></li>
                ${
                  data.userCompany
                    ? `<li>Company: <span class="highlight">${data.userCompany}</span></li>`
                    : ""
                }
                <li>Registration Date: <span class="highlight">${
                  data.registrationDate
                }</span></li>
            </ul>
        </div>
        
        <p>This is for your information only. The user's account is now active and they can access the system.</p>
        <p>Best regards,<br>Baawa Inventory POS System</p>
    </div>
  `;

  return {
    subject: `New User Registered: ${data.userFirstName} ${data.userLastName}`,
    html: createBaseTemplate(content, "New User Registration"),
    text: `New user registered:\n\nName: ${data.userFirstName} ${
      data.userLastName
    }\nEmail: ${data.userEmail}\n${
      data.userCompany ? `Company: ${data.userCompany}\n` : ""
    }Registration Date: ${data.registrationDate}`,
  };
}

function getAccountLockedTemplate(data: {
  firstName: string;
  reason: string;
}): EmailTemplate {
  const content = `
    <h1 class="title">Account Security Alert 🔒</h1>
    <div class="content">
        <p>Hi ${data.firstName},</p>
        <p>Your Baawa Inventory POS account has been temporarily locked for security reasons.</p>
        
        <div class="warning">
            <p><strong>Reason:</strong> ${data.reason}</p>
        </div>
        
        <p>To unlock your account, please contact our support team. They will help you regain access after verifying your identity.</p>
        <p>If you believe this is an error, please reach out to us immediately.</p>
        <p>Best regards,<br>The Baawa Team</p>
    </div>
  `;

  return {
    subject: "Account Security Alert - Baawa Inventory POS",
    html: createBaseTemplate(content, "Account Security Alert"),
    text: `Hi ${data.firstName},\n\nYour account has been locked.\n\nReason: ${data.reason}\n\nContact support to unlock your account.\n\nBest regards,\nThe Baawa Team`,
  };
}

function getRoleChangedTemplate(data: {
  firstName: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
}): EmailTemplate {
  const content = `
    <h1 class="title">Account Role Updated 👤</h1>
    <div class="content">
        <p>Hi ${data.firstName},</p>
        <p>Your role in Baawa Inventory POS has been updated.</p>
        
        <div class="info">
            <p><strong>Role Change Details:</strong></p>
            <ul>
                <li>Previous Role: <span class="highlight">${data.oldRole}</span></li>
                <li>New Role: <span class="highlight">${data.newRole}</span></li>
                <li>Changed By: <span class="highlight">${data.changedBy}</span></li>
            </ul>
        </div>
        
        <p>Your new permissions will take effect the next time you log in. You may need to refresh your browser if you're currently logged in.</p>
        <p>If you have any questions about your new role or permissions, please contact your administrator.</p>
        <p>Best regards,<br>The Baawa Team</p>
    </div>
  `;

  return {
    subject: "Your Role Has Been Updated - Baawa Inventory POS",
    html: createBaseTemplate(content, "Account Role Updated"),
    text: `Hi ${data.firstName},\n\nYour role has been changed from ${data.oldRole} to ${data.newRole} by ${data.changedBy}.\n\nBest regards,\nThe Baawa Team`,
  };
}

// Import the base template function from base-templates
function createBaseTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f7f7f7;
        }
        .container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            line-height: 1.8;
            color: #4b5563;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .highlight {
            background-color: #fef3c7;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
        }
        .warning {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
            color: #991b1b;
        }
        .info {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
            color: #1e40af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Baawa Inventory POS</div>
        </div>
        ${content}
        <div class="footer">
            <p>This email was sent from Baawa Inventory POS System</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>`;
}
