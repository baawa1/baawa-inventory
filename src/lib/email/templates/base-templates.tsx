import { EmailTemplate, EmailTemplateType, EmailTemplateData } from "../types";

/**
 * Base template wrapper with consistent styling
 */
const createBaseTemplate = (content: string, title: string): string => {
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
            <div class="logo">Baawa Accessories</div>
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
          data.companyName ? `and ${data.companyName}` : ""
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
    subject: "Welcome to Baawa Accessories!",
    html: createBaseTemplate(content, "Welcome to Baawa Accessories!"),
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
    subject: "Verify Your Email Address - Baawa Accessories",
    html: createBaseTemplate(content, "Verify Your Email Address"),
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
    subject: "Reset Your Password - Baawa Accessories",
    html: createBaseTemplate(content, "Reset Your Password"),
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
    subject: "Your Account Has Been Approved! - Baawa Accessories",
    html: createBaseTemplate(content, "Account Approved!"),
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
                    : ""
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
    html: createBaseTemplate(content, "New User Registration Pending"),
    text: `New user registration pending approval:\n\nName: ${
      data.userFirstName
    } ${data.userLastName}\nEmail: ${data.userEmail}\n${
      data.userCompany ? `Company: ${data.userCompany}\n` : ""
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
    subject: "Password Reset Successful - Baawa Accessories",
    html: createBaseTemplate(content, "Password Reset Successful"),
    text: `Hi ${data.firstName},\n\nYour password has been successfully reset.\n\nIf you did not make this change, please contact support immediately.\n\nBest regards,\nThe Baawa Team`,
  };
};
