import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';
import { envConfig } from '@/lib/config/env-validation';

export async function GET(_req: NextRequest) {
  // Only allow test endpoints in development
  if (!envConfig.isDevelopment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const token = await auth();

    // Simulate middleware logic
    const pathname = '/dashboard'; // Simulate accessing dashboard

    // Public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/login',
      '/logout',
      '/forgot-password',
      '/reset-password',
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

    if (!isEmailVerified || userStatus !== 'APPROVED') {
      return NextResponse.json({
        result: 'redirect_to_unauthorized',
        message: 'User is not active for protected access',
        userStatus,
        isEmailVerified,
      });
    }

    return NextResponse.json({
      result: 'access_granted',
      message: 'User is approved and can access dashboard (development only)',
      userStatus,
      isEmailVerified,
      userRole,
    });
  } catch (error) {
    // Use existing logger - will only show in development
    const { logger } = await import('@/lib/logger');
    logger.error('Test middleware error', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
