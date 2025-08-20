import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { emailService } from '@/lib/email/service';
import { AuditLogger } from '@/lib/utils/audit-logger';
import {
  emailSchema,
  nameSchema,
  passwordSchema,
} from '@/lib/validations/common';
import { randomBytes } from 'crypto';
import { withRateLimit } from '@/lib/rate-limiting';
import { getAppBaseUrl } from '@/lib/utils';

// Registration validation schema
const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

async function registerHandler(request: NextRequest) {
  let body: any;

  try {
    body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
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
        // User exists but email not verified - resend verification
        const verificationToken = randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
          },
        });

        // Send verification email
        await emailService.sendVerificationEmail(email, {
          firstName,
          verificationLink: `${getAppBaseUrl()}/verify-email?token=${verificationToken}`,
          expiresInHours: 24,
        });

        return NextResponse.json(
          {
            message: 'Verification email sent. Please check your inbox.',
            requiresVerification: true,
          },
          { status: 200 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

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
    let emailId: string | undefined = undefined;
    try {
      if (
        process.env.NODE_ENV !== 'production' &&
        typeof emailService.sendVerificationEmailWithId === 'function'
      ) {
        emailId = await emailService.sendVerificationEmailWithId(email, {
          firstName,
          verificationLink: `${getAppBaseUrl()}/verify-email?token=${verificationToken}`,
          expiresInHours: 24,
        });
      } else {
        await emailService.sendVerificationEmail(email, {
          firstName,
          verificationLink: `${getAppBaseUrl()}/verify-email?token=${verificationToken}`,
          expiresInHours: 24,
        });
      }
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
    const response: any = {
      message:
        'Registration successful! Please check your email to verify your account.',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.userStatus,
        role: user.role,
      },
      requiresVerification: true,
      redirectTo: '/check-email', // Add explicit redirect instruction
    };
    if (emailId) {
      response.emailId = emailId;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);

    // Log the error for debugging
    await AuditLogger.logAuthEvent(
      {
        action: 'REGISTRATION',
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
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    return `register:${ip}`;
  },
})(registerHandler);
