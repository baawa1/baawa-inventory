import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
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
      headers: Object.fromEntries(req.headers.entries()),
    });
  } catch (error) {
    return handleApiError(error);
  }
});
