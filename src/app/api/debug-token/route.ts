import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { envConfig } from '@/lib/config/env-validation';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  // Only allow debug endpoints in development
  if (!envConfig.isDevelopment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  try {
    return NextResponse.json({
      success: true,
      hasToken: true,
      token: {
        user: req.user,
        role: req.user.role,
        status: req.user.status,
        isEmailVerified: req.user.isEmailVerified,
        name: req.user.name,
      },
      message: 'Debug token info (development only)',
      // Remove sensitive headers exposure
      headersCount: Array.from(req.headers.keys()).length,
    });
  } catch (error) {
    return handleApiError(error);
  }
});