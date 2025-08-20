import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { emailService } from '@/lib/email/service';
import { AuditLogger } from '@/lib/utils/audit-logger';
import { randomBytes } from 'crypto';
import { getAppBaseUrl } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        emailVerificationExpires: true,
        userStatus: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if user is already verified
    if (user.emailVerified || user.userStatus !== 'PENDING') {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Update user as email verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
        userStatus: 'VERIFIED', // Email verified, but still needs admin approval
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        userStatus: true,
        emailVerified: true,
      },
    });

    // Log the email verification
    await AuditLogger.logAuthEvent(
      {
        action: 'EMAIL_VERIFICATION',
        userEmail: user.email,
        success: true,
        userId: user.id,
      },
      request
    );

    return NextResponse.json({
      message:
        'Email verified successfully! Your account is now pending admin approval.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        status: updatedUser.userStatus,
        emailVerified: updatedUser.emailVerified,
      },
      // Indicate that the client should refresh the session
      shouldRefreshSession: true,
      redirectTo: '/pending-approval', // Add explicit redirect instruction
    });
  } catch (error) {
    console.error('Error in POST /api/auth/verify-email:', error);

    // Log the error
    await AuditLogger.logAuthEvent(
      {
        action: 'EMAIL_VERIFICATION',
        userEmail: 'unknown',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
      request
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate new verification token for existing user
export async function PUT(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        firstName: true,
        email: true,
        userStatus: true,
        emailVerified: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already verified
    if (user.emailVerified || user.userStatus !== 'PENDING') {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Send new verification email
    try {
      const verificationLink = `${getAppBaseUrl()}/verify-email?token=${verificationToken}`;

      await emailService.sendVerificationEmail(email, {
        firstName: user.firstName,
        verificationLink,
        expiresInHours: 24,
      });

      // Log the resend verification email
      await AuditLogger.logAuthEvent(
        {
          action: 'EMAIL_VERIFICATION',
          userEmail: user.email,
          success: true,
          userId: user.id,
        },
        request
      );

      return NextResponse.json({
        message: 'New verification email sent successfully!',
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in PUT /api/auth/verify-email:', error);

    // Log the error
    await AuditLogger.logAuthEvent(
      {
        action: 'EMAIL_VERIFICATION',
        userEmail: 'unknown',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
      request
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
