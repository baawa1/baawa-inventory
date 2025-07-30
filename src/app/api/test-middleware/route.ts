import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';

export async function GET(_req: NextRequest) {
  try {
    const token = await auth();

    // Simulate middleware logic
    const pathname = '/dashboard'; // Simulate accessing dashboard

    // Public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/login',
      '/logout',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/check-email',
      '/verify-email',
      '/pending-approval',
      '/unauthorized',
    ];

    // Allow public routes without any checks
    if (publicRoutes.includes(pathname)) {
      return NextResponse.json({
        result: 'public_route',
        message: 'Public route - no checks needed',
      });
    }

    // If no token, redirect to login
    if (!token?.user) {
      return NextResponse.json({
        result: 'redirect_to_login',
        message: 'No token - should redirect to login',
        token: null,
      });
    }

    // Extract user information from token
    const userRole = (token as any).role;
    const userStatus = (token as any).status;
    const isEmailVerified = Boolean((token as any).isEmailVerified);

    // Debug logging removed for production

    // Authentication Flow Logic:
    // 1. Unverified users → verify-email page
    // 2. Verified but unapproved users → pending-approval page
    // 3. Approved users → dashboard
    // 4. Rejected/denied users → unauthorized page

    // Check if email is not verified
    if (!isEmailVerified) {
      return NextResponse.json({
        result: 'redirect_to_verify_email',
        message: 'Email not verified - should redirect to verify-email',
        userStatus,
        isEmailVerified,
      });
    }

    // Check user status after email verification
    if (userStatus === 'PENDING') {
      return NextResponse.json({
        result: 'redirect_to_pending_approval',
        message: 'User status is PENDING (needs admin approval)',
        userStatus,
        isEmailVerified,
      });
    }

    if (userStatus === 'VERIFIED') {
      return NextResponse.json({
        result: 'redirect_to_pending_approval',
        message: 'User status is VERIFIED (needs admin approval)',
        userStatus,
        isEmailVerified,
      });
    }

    if (userStatus === 'REJECTED' || userStatus === 'SUSPENDED') {
      return NextResponse.json({
        result: 'redirect_to_unauthorized',
        message: `User status is ${userStatus}`,
        userStatus,
        isEmailVerified,
      });
    }

    // At this point, user should be APPROVED
    if (userStatus !== 'APPROVED') {
      return NextResponse.json({
        result: 'redirect_to_unauthorized',
        message: `Invalid user status: ${userStatus}`,
        userStatus,
        isEmailVerified,
      });
    }

    return NextResponse.json({
      result: 'access_granted',
      message: 'User is approved and can access dashboard',
      userStatus,
      isEmailVerified,
      userRole,
    });
  } catch (error) {
    console.error('Test middleware error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
