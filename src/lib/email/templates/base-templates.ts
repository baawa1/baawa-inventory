import {
  EmailTemplate,
  UserSuspensionData,
  UserReactivationData,
  ReceiptEmailData,
} from '../types';
import { getFullLogoUrl, getLogoUrl } from '../utils/logo-utils';

/**
 * Base template wrapper with consistent styling
 */
const createBaseTemplate = (content: string, title: string): string => {
  const logoUrl = getFullLogoUrl('brand-color');
  const iconUrl = getLogoUrl('brand-color');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <!-- Email client avatar metadata -->
    <meta property="og:image" content="${iconUrl}">
    <meta name="twitter:image" content="${iconUrl}">
    <link rel="icon" type="image/png" href="${iconUrl}">
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
            <img src="${logoUrl}" alt="BaaWA Accessories Logo" style="max-width: 200px; height: auto; margin-bottom: 20px;">
        </div>
        ${content}
        <div class="footer">
            <p>This email was sent from Baawa Accessories System</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>`;
};

/**
 * Welcome email template
 */
export const welcomeTemplate = (data: {
  firstName: string;
  email: string;
  companyName?: string;
}): EmailTemplate => {
  const content = `
    <h1 class="title">Welcome to Baawa Accessories! 🎉</h1>
    <div class="content">
        <p>Hi ${data.firstName},</p>
        <p>Welcome to Baawa Accessories! We're excited to have you ${
          data.companyName ? `and ${data.companyName}` : ''
        } on board.</p>
        
        <div class="info">
            <p><strong>What's next?</strong></p>
            <ul>
                <li>Verify your email address</li>
                <li>Wait for admin approval</li>
                <li>Start managing your inventory</li>
            </ul>
        </div>
        
        <p>Your account is currently pending approval. Once approved by an administrator, you'll receive another email with access instructions.</p>
        <p>If you have any questions while waiting, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Baawa Team</p>
    </div>
  `;

  return {
    subject: 'Welcome to Baawa Accessories!',
    html: createBaseTemplate(content, 'Welcome to Baawa Accessories!'),
    text: `Hi ${data.firstName},\n\nWelcome to Baawa Accessories! Your account is pending approval. You'll receive another email once approved.\n\nBest regards,\nThe Baawa Team`,
  };
};

/**
 * Email verification template
 */
export const emailVerificationTemplate = (data: {
  firstName: string;
  verificationLink: string;
  expiresInHours: number;
}): EmailTemplate => {
  const content = `
    <h1 class="title">Verify Your Email Address 📧</h1>
    <div class="content">
        <p>Hi ${data.firstName},</p>
        <p>Thank you for registering with Baawa Accessories! To complete your registration, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center;">
            <a href="${data.verificationLink}" class="button">Verify Email Address</a>
        </div>
        
        <div class="warning">
            <p><strong>Important:</strong> This verification link will expire in <span class="highlight">${data.expiresInHours} hours</span>.</p>
        </div>
        
        <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
        <p><a href="${data.verificationLink}">${data.verificationLink}</a></p>
        
        <p>If you didn't create an account with us, please ignore this email.</p>
        <p>Best regards,<br>The Baawa Team</p>
    </div>
  `;

  return {
    subject: 'Verify Your Email Address - Baawa Accessories',
    html: createBaseTemplate(content, 'Verify Your Email Address'),
    text: `Hi ${data.firstName},\n\nPlease verify your email address by visiting: ${data.verificationLink}\n\nThis link expires in ${data.expiresInHours} hours.\n\nBest regards,\nThe Baawa Team`,
  };
};

/**
 * Password reset template
 */
export const passwordResetTemplate = (data: {
  firstName: string;
  resetLink: string;
  expiresInHours: number;
}): EmailTemplate => {
  const content = `
    <h1 class="title">Reset Your Password 🔐</h1>
    <div class="content">
        <p>Hi ${data.firstName},</p>
        <p>We received a request to reset your password for your Baawa Accessories account. Click the button below to create a new password:</p>
        
        <div style="text-align: center;">
            <a href="${data.resetLink}" class="button">Reset Password</a>
        </div>
        
        <div class="warning">
            <p><strong>Important:</strong> This reset link will expire in <span class="highlight">${data.expiresInHours} hours</span>.</p>
        </div>
        
        <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
        <p><a href="${data.resetLink}">${data.resetLink}</a></p>
        
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <p>Best regards,<br>The Baawa Team</p>
    </div>
  `;

  return {
    subject: 'Reset Your Password - Baawa Accessories',
    html: createBaseTemplate(content, 'Reset Your Password'),
    text: `Hi ${data.firstName},\n\nReset your password by visiting: ${data.resetLink}\n\nThis link expires in ${data.expiresInHours} hours.\n\nBest regards,\nThe Baawa Team`,
  };
};

/**
 * User approval notification template
 */
export const userApprovalTemplate = (data: {
  firstName: string;
  adminName: string;
  dashboardLink: string;
  role: string;
}): EmailTemplate => {
  const content = `
    <h1 class="title">Account Approved! 🎉</h1>
    <div class="content">
        <p>Hi ${data.firstName},</p>
        <p>Great news! Your Baawa Accessories account has been approved by ${data.adminName}.</p>
        
        <div class="info">
            <p><strong>Account Details:</strong></p>
            <ul>
                <li>Role: <span class="highlight">${data.role}</span></li>
                <li>Status: Approved</li>
            </ul>
        </div>
        
        <p>You can now access your dashboard and start using the inventory management system:</p>
        
        <div style="text-align: center;">
            <a href="${data.dashboardLink}" class="button">Access Dashboard</a>
        </div>
        
        <p>If you have any questions about using the system, please don't hesitate to reach out to our support team.</p>
        <p>Welcome aboard!</p>
        <p>Best regards,<br>The Baawa Team</p>
    </div>
  `;

  return {
    subject: 'Your Account Has Been Approved! - Baawa Accessories',
    html: createBaseTemplate(content, 'Account Approved!'),
    text: `Hi ${data.firstName},\n\nYour account has been approved! You can now access your dashboard at: ${data.dashboardLink}\n\nRole: ${data.role}\n\nBest regards,\nThe Baawa Team`,
  };
};

/**
 * Admin new user notification template
 */
export const adminNewUserNotificationTemplate = (data: {
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userCompany?: string;
  approvalLink: string;
  registrationDate: string;
}): EmailTemplate => {
  const content = `
    <h1 class="title">New User Registration Pending 👤</h1>
    <div class="content">
        <p>Hello Admin,</p>
        <p>A new user has registered for Baawa Accessories and is awaiting approval.</p>
        
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
                    : ''
                }
                <li>Registration Date: <span class="highlight">${
                  data.registrationDate
                }</span></li>
            </ul>
        </div>
        
        <p>Please review this user's information and approve or reject their account:</p>
        
        <div style="text-align: center;">
            <a href="${
              data.approvalLink
            }" class="button">Review User Application</a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
        <p><a href="${data.approvalLink}">${data.approvalLink}</a></p>
        
        <p>Best regards,<br>Baawa Accessories System</p>
    </div>
  `;

  return {
    subject: `New User Registration: ${data.userFirstName} ${data.userLastName} - Approval Required`,
    html: createBaseTemplate(content, 'New User Registration Pending'),
    text: `New user registration pending approval:\n\nName: ${
      data.userFirstName
    } ${data.userLastName}\nEmail: ${data.userEmail}\n${
      data.userCompany ? `Company: ${data.userCompany}\n` : ''
    }Registration Date: ${data.registrationDate}\n\nReview at: ${
      data.approvalLink
    }`,
  };
};

/**
 * Password reset confirmation template
 */
export const passwordResetConfirmationTemplate = (data: {
  firstName: string;
}): EmailTemplate => {
  const content = `
    <h1 class="title">Password Reset Successful ✅</h1>
    <div class="content">
        <p>Hi ${data.firstName},</p>
        <p>Your password has been successfully reset for your Baawa Accessories account.</p>
        
        <div class="info">
            <p>If you did not make this change, please contact our support team immediately.</p>
        </div>
        
        <p>For security reasons, you may want to:</p>
        <ul>
            <li>Review your account activity</li>
            <li>Update your security settings</li>
            <li>Enable two-factor authentication (when available)</li>
        </ul>
        
        <p>Best regards,<br>The Baawa Team</p>
    </div>
  `;

  return {
    subject: 'Password Reset Successful - Baawa Accessories',
    html: createBaseTemplate(content, 'Password Reset Successful'),
    text: `Hi ${data.firstName},\n\nYour password has been successfully reset.\n\nIf you did not make this change, please contact support immediately.\n\nBest regards,\nThe Baawa Team`,
  };
};

/**
 * User rejection notification template
 */
export const userRejectionTemplate = (data: {
  firstName: string;
  adminName: string;
  rejectionReason?: string;
  supportEmail: string;
}): EmailTemplate => {
  const content = `
    <h1 class="title">Account Application Update</h1>
    <div class="content">
        <p>Hi ${data.firstName},</p>
        <p>Thank you for your interest in joining Baawa Accessories. After careful review, we regret to inform you that your account application has not been approved at this time.</p>
        
        ${
          data.rejectionReason
            ? `
        <div class="info">
            <p><strong>Reason:</strong></p>
            <p>${data.rejectionReason}</p>
        </div>
        `
            : ''
        }
        
        <p>If you believe this decision was made in error or if you have additional information to support your application, please don't hesitate to contact our support team.</p>
        
        <div class="info">
            <p><strong>Contact Support:</strong></p>
            <p>Email: <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
        </div>
        
        <p>We appreciate your understanding and wish you all the best.</p>
        <p>Best regards,<br>The Baawa Team</p>
    </div>
  `;

  return {
    subject: 'Account Application Update - Baawa Accessories',
    html: createBaseTemplate(content, 'Account Application Update'),
    text: `Hi ${data.firstName},\n\nYour account application has not been approved at this time.${data.rejectionReason ? `\n\nReason: ${data.rejectionReason}` : ''}\n\nFor questions, contact: ${data.supportEmail}\n\nBest regards,\nThe Baawa Team`,
  };
};

/**
 * Role change notification template
 */
export const roleChangeTemplate = (data: {
  firstName: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
  dashboardLink: string;
}): EmailTemplate => {
  const content = `
    <h1 class="title">Your Role Has Been Updated</h1>
    <div class="content">
        <p>Hi ${data.firstName},</p>
        <p>Your role in the Baawa Accessories system has been updated by ${data.changedBy}.</p>
        
        <div class="info">
            <p><strong>Role Change Details:</strong></p>
            <ul>
                <li>Previous Role: <span class="highlight">${data.oldRole}</span></li>
                <li>New Role: <span class="highlight">${data.newRole}</span></li>
                <li>Changed By: ${data.changedBy}</li>
                <li>Date: ${new Date().toLocaleDateString()}</li>
            </ul>
        </div>
        
        <p>Your new role may include different permissions and access levels. Please log into your dashboard to see the updated interface:</p>
        
        <div style="text-align: center;">
            <a href="${data.dashboardLink}" class="button">Access Dashboard</a>
        </div>
        
        <p>If you have any questions about your new role or need assistance, please contact our support team.</p>
        <p>Best regards,<br>The Baawa Team</p>
    </div>
  `;

  return {
    subject: 'Your Role Has Been Updated - Baawa Accessories',
    html: createBaseTemplate(content, 'Role Updated'),
    text: `Hi ${data.firstName},\n\nYour role has been updated from ${data.oldRole} to ${data.newRole} by ${data.changedBy}.\n\nAccess your dashboard: ${data.dashboardLink}\n\nBest regards,\nThe Baawa Team`,
  };
};

/**
 * Admin digest email template for new user registrations
 */
export const adminDigestTemplate = (data: {
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
}): EmailTemplate => {
  const usersListHtml = data.newUsers
    .map(
      user => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; border: 1px solid #e5e7eb;">${user.firstName} ${user.lastName}</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">${user.email}</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">${user.status}</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">${new Date(user.registrationDate).toLocaleDateString()}</td>
    </tr>
  `
    )
    .join('');

  const content = `
    <h1 class="title">User Registration Digest</h1>
    <div class="content">
        <p>Hi ${data.adminName},</p>
        <p>Here's your ${data.digestPeriod} summary of user registration activity for Baawa Accessories:</p>
        
        <div class="info">
            <h3 style="color: #2563eb; margin-bottom: 16px;">Summary</h3>
            <ul>
                <li><strong>New Registrations:</strong> ${data.newUsersCount} users</li>
                <li><strong>Pending Approvals:</strong> ${data.pendingUsersCount} users</li>
                <li><strong>Period:</strong> ${data.digestPeriod}</li>
            </ul>
        </div>

        ${
          data.newUsers.length > 0
            ? `
        <div style="margin: 24px 0;">
            <h3 style="color: #2563eb; margin-bottom: 16px;">New Registrations</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <thead>
                    <tr style="background-color: #f9fafb;">
                        <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Name</th>
                        <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Email</th>
                        <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Status</th>
                        <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left;">Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${usersListHtml}
                </tbody>
            </table>
        </div>
        `
            : ''
        }
        
        ${
          data.pendingUsersCount > 0
            ? `
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p><strong>⚠️ Action Required:</strong></p>
            <p>You have ${data.pendingUsersCount} user${data.pendingUsersCount === 1 ? '' : 's'} pending approval. Please review and approve or reject these registrations.</p>
        </div>
        `
            : ''
        }
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardLink}" class="button">Review Pending Users</a>
        </div>
        
        <p>Best regards,<br>Baawa Inventory System</p>
    </div>
  `;

  const usersListText = data.newUsers
    .map(
      user =>
        `- ${user.firstName} ${user.lastName} (${user.email}) - ${user.status} - ${new Date(user.registrationDate).toLocaleDateString()}`
    )
    .join('\n');

  return {
    subject: `User Registration Digest (${data.newUsersCount} new) - Baawa Accessories`,
    html: createBaseTemplate(content, 'User Registration Digest'),
    text: `User Registration Digest\n\nHi ${data.adminName},\n\nSummary for ${data.digestPeriod}:\n- New Registrations: ${data.newUsersCount}\n- Pending Approvals: ${data.pendingUsersCount}\n\nNew Users:\n${usersListText || 'None'}\n\nReview at: ${data.dashboardLink}\n\nBest regards,\nBaawa Inventory System`,
  };
};

/**
 * User suspension notification template
 */
export const userSuspensionTemplate = (
  data: UserSuspensionData
): EmailTemplate => {
  const content = `
    <h1 class="title">Account Suspended</h1>
    <div class="content">
        <p>Dear ${data.firstName} ${data.lastName},</p>
        
        <p>We regret to inform you that your Baawa Accessories account has been temporarily suspended.</p>
        
        <div class="warning">
            <h3>Suspension Reason:</h3>
            <p>${data.reason}</p>
        </div>
        
        <p>During this suspension period, you will not be able to access your account or use our services.</p>
        
        <p>If you believe this suspension was made in error or would like to discuss this matter, please contact our support team.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${data.supportEmail || 'support@baawa.com'}" class="button" style="background-color: #dc3545;">Contact Support</a>
        </div>
        
        <p>Best regards,<br>Baawa Accessories Team</p>
    </div>
  `;

  return {
    subject: 'Account Suspended - Baawa Accessories',
    html: createBaseTemplate(content, 'Account Suspended'),
    text: `Account Suspended\n\nDear ${data.firstName} ${data.lastName},\n\nYour Baawa Accessories account has been temporarily suspended.\n\nReason: ${data.reason}\n\nDuring this suspension, you cannot access your account. Contact support if needed: ${data.supportEmail || 'support@baawa.com'}\n\nBest regards,\nBaawa Accessories Team`,
  };
};

/**
 * User reactivation notification template
 */
export const userReactivationTemplate = (
  data: UserReactivationData
): EmailTemplate => {
  const content = `
    <h1 class="title">Account Reactivated</h1>
    <div class="content">
        <p>Dear ${data.firstName} ${data.lastName},</p>
        
        <p>Good news! Your Baawa Accessories account has been reactivated and you can now access all services again.</p>
        
        <div class="info">
            <h3>🎉 Welcome Back!</h3>
            <p>Your account suspension has been lifted and you have full access to your account.</p>
        </div>
        
        <p>You can now:</p>
        <ul>
            <li>Access your dashboard</li>
            <li>Use all platform features</li>
            <li>Manage your account settings</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginLink || 'https://inventory.baawa.com/login'}" class="button">Access Your Account</a>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <p>Best regards,<br>Baawa Accessories Team</p>
    </div>
  `;

  return {
    subject: 'Account Reactivated - Welcome Back! - Baawa Accessories',
    html: createBaseTemplate(content, 'Account Reactivated'),
    text: `Account Reactivated\n\nDear ${data.firstName} ${data.lastName},\n\nGreat news! Your Baawa Accessories account has been reactivated.\n\nYou can now access your dashboard and use all features again.\n\nLogin at: ${data.loginLink || 'https://inventory.baawa.com/login'}\n\nWelcome back!\n\nBest regards,\nBaawa Accessories Team`,
  };
};

/**
 * Receipt Email Template
 */
export const createReceiptEmailTemplate = (
  data: ReceiptEmailData
): EmailTemplate => {
  const formattedDate = data.timestamp.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsHtml = data.items
    .map(
      item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₦${item.price.toLocaleString()}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₦${item.total.toLocaleString()}</td>
    </tr>
  `
    )
    .join('');

  const content = `
    <div class="content">
        <h2 style="color: #2563eb; margin-bottom: 20px;">Thank you for your purchase!</h2>
        
        <p>Dear ${data.customerName},</p>
        
        <p>Thank you for shopping with Baawa Accessories! Here's your receipt for your recent purchase:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">Purchase Details</h3>
            <p><strong>Receipt #:</strong> ${data.saleId}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
            <p><strong>Served by:</strong> ${data.staffName}</p>
        </div>
        
        <div style="margin: 30px 0;">
            <h3 style="color: #1f2937; margin-bottom: 15px;">Items Purchased</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
        </div>
        
        <div style="border-top: 2px solid #2563eb; padding-top: 20px; margin-top: 30px;">
            <div style="text-align: right; font-size: 16px;">
                <p><strong>Subtotal: ₦${data.subtotal.toLocaleString()}</strong></p>
                ${data.discount > 0 ? `<p style="color: #dc2626;"><strong>Discount: -₦${data.discount.toLocaleString()}</strong></p>` : ''}
                <p style="font-size: 18px; color: #2563eb;"><strong>Total: ₦${data.total.toLocaleString()}</strong></p>
            </div>
        </div>
        
        ${
          data.notes
            ? `
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">Notes</h3>
            <p style="margin: 0; font-size: 14px; color: #4b5563;">${data.notes}</p>
        </div>
        `
            : ''
        }
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">Return Policy</h3>
            <p style="margin: 0; font-size: 14px;">Items can be returned within 7 days of purchase with the original receipt. Please contact us if you have any issues with your purchase.</p>
        </div>
        
        <p>Thank you for choosing Baawa Accessories. We appreciate your business!</p>
        
        <p>Best regards,<br>Baawa Accessories Team</p>
    </div>
  `;

  return {
    subject: `Receipt for Your Purchase - ${data.saleId} - Baawa Accessories`,
    html: createBaseTemplate(content, 'Purchase Receipt'),
    text: `Purchase Receipt\n\nDear ${data.customerName},\n\nThank you for your purchase!\n\nReceipt #: ${data.saleId}\nDate: ${formattedDate}\nPayment Method: ${data.paymentMethod}\nServed by: ${data.staffName}\n\nItems:\n${data.items
      .map(
        item =>
          `${item.name} x${item.quantity} - ₦${item.total.toLocaleString()}`
      )
      .join(
        '\n'
      )}\n\nSubtotal: ₦${data.subtotal.toLocaleString()}\n${data.discount > 0 ? `Discount: -₦${data.discount.toLocaleString()}\n` : ''}Total: ₦${data.total.toLocaleString()}\n${data.notes ? `\nNotes: ${data.notes}\n` : ''}\n\nThank you for choosing Baawa Accessories!\n\nBest regards,\nBaawa Accessories Team`,
  };
};

/**
 * Creates a more robust email template that handles email clients that strip src attributes
 * Uses table-based layout and inline styles for better email client compatibility
 */
export const createRobustEmailTemplate = (
  content: string,
  title: string,
  logoVariant: 'brand-color' | 'black' | 'white' = 'brand-color'
): string => {
  const logoUrl = getFullLogoUrl(logoVariant);

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #ff3333 0%, #cc0000 100%);
                padding: 30px 20px;
                text-align: center;
            }
            .content {
                padding: 40px 30px;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            .footer-text {
                color: #6c757d;
                font-size: 14px;
                margin: 0;
            }
            .logo-fallback {
                font-size: 24px;
                font-weight: bold;
                color: #ffffff;
                text-decoration: none;
            }
            @media only screen and (max-width: 600px) {
                .email-container {
                    margin: 0;
                    border-radius: 0;
                }
                .content {
                    padding: 20px 15px;
                }
                .header {
                    padding: 20px 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                    <tr>
                        <td style="text-align: center;">
                            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="vertical-align: middle; padding-right: 15px;">
                                        <img src="${logoUrl}" alt="BaaWA Accessories Logo" style="width: 60px; height: 60px; object-fit: contain; display: block; border: 0;">
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <div style="font-size: 24px; font-weight: bold; color: #ffffff;">BaaWA Accessories</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p class="footer-text">
                    © ${new Date().getFullYear()} BaaWA Accessories. All rights reserved.<br>
                    If you have any questions, please contact us at support@baawa.ng
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};
