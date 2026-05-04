import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { emailService } from '@/lib/email/service';
import { AuditLogger } from '@/lib/utils/audit-logger';
import type { RegisterResponse } from '@/lib/auth/email-flow';
import { registerUserSchema } from '@/lib/validations/user';
import { randomBytes } from 'crypto';
import { withRateLimit } from '@/lib/rate-limiting';
import { getAppBaseUrl } from '@/lib/utils';
import { AuditLogAction } from '@/types/audit';
import { getClientIp } from '@/lib/utils/request-ip';

function createVerificationToken() {
  return {
    token: randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

async function sendVerificationEmail(
  email: string,
  firstName: string,
  verificationToken: string
) {
  const verificationLink = `${getAppBaseUrl()}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
    email
  )}`;

  if (
    process.env.NODE_ENV !== 'production' &&
    typeof emailService.sendVerificationEmailWithId === 'function'
  ) {
    const emailId = await emailService.sendVerificationEmailWithId(email, {
      firstName,
      verificationLink,
      expiresInHours: 24,
    });

    return { emailId, verificationEmailSent: true };
  }

  await emailService.sendVerificationEmail(email, {
    firstName,
    verificationLink,
    expiresInHours: 24,
  });

  return { verificationEmailSent: true };
}

function buildRegisterResponse(
  email: string,
  message: string,
  verificationEmailSent: boolean,
  user?: RegisterResponse['user'],
  emailId?: string
) {
  const response: RegisterResponse & { emailId?: string } = {
    message,
    email,
    user,
    requiresVerification: true,
    redirectTo: '/check-email',
    verificationEmailSent,
  };

  if (emailId) {
    response.emailId = emailId;
  }

  return response;
}

async function registerHandler(request: NextRequest) {
  let body: any;

  try {
    body = await request.json();

    // Validate input
    const validation = registerUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, emailVerified: true },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      } else {
        const { token: verificationToken, expiresAt: verificationExpires } =
          createVerificationToken();

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
            isActive: true,
          },
        });

        let verificationEmailSent = false;
        try {
          await sendVerificationEmail(email, firstName, verificationToken);
          verificationEmailSent = true;
        } catch (emailError) {
          console.error(
            'Failed to resend verification email for pending user:',
            emailError
          );
        }

        return NextResponse.json(
          buildRegisterResponse(
            email.toLowerCase(),
            verificationEmailSent
              ? 'We found an existing pending account and sent a fresh verification email. Use the original account details you registered with after you verify your email.'
              : 'We found an existing pending account, but we could not send the verification email. Request another link from the next screen.',
            verificationEmailSent
          ),
          { status: 200 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const { token: verificationToken, expiresAt: verificationExpires } =
      createVerificationToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        userStatus: 'PENDING',
        role: 'STAFF', // Default role
        isActive: true,
        emailNotifications: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userStatus: true,
        role: true,
        createdAt: true,
      },
    });

    // Log user registration
    await AuditLogger.logRegistration(user.email, user.role, request);

    // Send verification email and get Resend email ID if possible
    let verificationEmailSent = false;
    let emailId: string | undefined;
    try {
      const emailResult = await sendVerificationEmail(
        email,
        firstName,
        verificationToken
      );
      verificationEmailSent = emailResult.verificationEmailSent;
      emailId = emailResult.emailId;
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the registration if email sending fails
      // The user can request a new verification email later
    }

    // Send admin notification for new user
    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { email: true },
      });

      if (adminUsers.length > 0) {
        await emailService.sendAdminNewUserNotification(
          adminUsers.map(admin => admin.email),
          {
            userFirstName: firstName,
            userLastName: lastName,
            userEmail: email,
            approvalLink: `${getAppBaseUrl()}/admin/users`,
            registrationDate: new Date().toISOString(),
          }
        );
      }
    } catch (adminEmailError) {
      console.error(
        'Failed to send admin notification email:',
        adminEmailError
      );
      // Don't fail the registration if admin notification fails
    }

    // Build response
    return NextResponse.json(
      buildRegisterResponse(
        user.email,
        verificationEmailSent
          ? 'Registration successful! Please check your email to verify your account.'
          : 'Registration successful, but we could not send your verification email. Request another link from the next screen.',
        verificationEmailSent,
        {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: user.userStatus,
          role: user.role,
        },
        emailId
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Log the error for debugging
    await AuditLogger.logAuthEvent(
      {
        action: AuditLogAction.REGISTRATION,
        userEmail: body?.email,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
      request
    );

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Apply rate limiting (5 requests per hour per IP)
export const POST = withRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 requests per hour
  keyGenerator: request => {
    return `register:${getClientIp(request)}`;
  },
})(registerHandler);
