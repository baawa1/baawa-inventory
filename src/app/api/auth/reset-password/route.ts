import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { emailService } from '@/lib/email/service';
import { AuditLogger } from '@/lib/utils/audit-logger';
import { passwordSchema } from '@/lib/validations/common';
import { getAppBaseUrl } from '@/lib/utils';
import { withRateLimit } from '@/lib/rate-limiting';

// Reset password validation schema
const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

async function resetPasswordHandler(request: NextRequest) {
  let body: any;

  try {
    body = await request.json();

    // Validate input
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Find user by reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(), // Token must not be expired
        },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userStatus: true,
        emailVerified: true,
      },
    });

    if (!user) {
      // Log failed password reset attempt
      await AuditLogger.logAuthEvent(
        {
          action: 'PASSWORD_RESET_SUCCESS',
          success: false,
          errorMessage: 'Invalid or expired reset token',
          details: { token: token.substring(0, 8) + '...' }, // Log partial token for debugging
        },
        request
      );

      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Verify user is in good standing
    if (!user.emailVerified || user.userStatus !== 'APPROVED') {
      await AuditLogger.logAuthEvent(
        {
          action: 'PASSWORD_RESET_SUCCESS',
          userId: user.id,
          userEmail: user.email,
          success: false,
          errorMessage: `User not eligible: verified=${user.emailVerified}, status=${user.userStatus}`,
        },
        request
      );

      return NextResponse.json(
        { error: 'Account is not eligible for password reset' },
        { status: 403 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        // Update last activity to prevent session issues
        lastActivity: new Date(),
      },
    });

    // Log successful password reset
    await AuditLogger.logPasswordResetSuccess(user.id, user.email, request);

    // Send confirmation email
    await emailService.sendPasswordResetEmail(user.email, {
      firstName: user.firstName,
      resetLink: `${getAppBaseUrl()}/login`,
      expiresInHours: 0, // This is a confirmation, not a reset link
    });

    return NextResponse.json(
      {
        message:
          'Password reset successful! You can now login with your new password.',
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);

    // Log the error
    await AuditLogger.logAuthEvent(
      {
        action: 'PASSWORD_RESET_SUCCESS',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        details: { token: body?.token?.substring(0, 8) + '...' },
      },
      request
    );

    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
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
    return `reset-password:${ip}`;
  },
})(resetPasswordHandler);
