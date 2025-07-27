import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { AuditLogger } from '@/lib/utils/audit-logger';
import { withRateLimit } from '@/lib/rate-limiting';

// Validate reset token schema
const validateTokenSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
});

async function validateResetTokenHandler(request: NextRequest) {
  let body: any;

  try {
    body = await request.json();

    // Validate input
    const validation = validateTokenSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid token format',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { token } = validation.data;

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
        resetTokenExpires: true,
      },
    });

    if (!user) {
      // Log failed validation attempt
      await AuditLogger.logAuthEvent(
        {
          action: 'PASSWORD_RESET_REQUEST',
          success: false,
          errorMessage: 'Invalid or expired reset token',
          details: {
            action: 'token_validation',
            token: token.substring(0, 8) + '...',
          },
        },
        request
      );

      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid or expired reset token',
        },
        { status: 400 }
      );
    }

    // Verify user is in good standing
    if (!user.emailVerified || user.userStatus !== 'APPROVED') {
      await AuditLogger.logAuthEvent(
        {
          action: 'PASSWORD_RESET_REQUEST',
          userId: user.id,
          userEmail: user.email,
          success: false,
          errorMessage: `User not eligible: verified=${user.emailVerified}, status=${user.userStatus}`,
          details: { action: 'token_validation' },
        },
        request
      );

      return NextResponse.json(
        {
          valid: false,
          error: 'Account is not eligible for password reset',
        },
        { status: 403 }
      );
    }

    // Calculate time remaining
    const timeRemaining = Math.max(
      0,
      user.resetTokenExpires!.getTime() - Date.now()
    );
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor(
      (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
    );

    // Log successful validation
    await AuditLogger.logAuthEvent(
      {
        action: 'PASSWORD_RESET_REQUEST',
        userId: user.id,
        userEmail: user.email,
        success: true,
        details: {
          action: 'token_validation',
          timeRemaining: `${hoursRemaining}h ${minutesRemaining}m`,
        },
      },
      request
    );

    return NextResponse.json(
      {
        valid: true,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        expiresAt: user.resetTokenExpires!.toISOString(),
        timeRemaining: {
          hours: hoursRemaining,
          minutes: minutesRemaining,
          total: timeRemaining,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Validate reset token error:', error);

    // Log the error
    await AuditLogger.logAuthEvent(
      {
        action: 'PASSWORD_RESET_REQUEST',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        details: {
          action: 'token_validation',
          token: body?.token?.substring(0, 8) + '...',
        },
      },
      request
    );

    return NextResponse.json(
      {
        valid: false,
        error: 'Failed to validate reset token. Please try again.',
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting (10 requests per hour per IP)
export const POST = withRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 requests per hour (more lenient as this is just validation)
  keyGenerator: request => {
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    return `validate-reset-token:${ip}`;
  },
})(validateResetTokenHandler);
