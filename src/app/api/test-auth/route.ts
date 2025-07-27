import { cookies } from 'next/headers';
import { sign } from 'jsonwebtoken';
import { createApiResponse } from '@/lib/api-response';

export async function POST(request: Request) {
  try {
    const { email, role, status, isEmailVerified } = await request.json();

    // Validate required fields
    if (!email || !role || !status) {
      return createApiResponse.validationError('Missing required fields');
    }

    // Create a test JWT token
    const testToken = sign(
      {
        user: {
          email,
          role,
          status,
          isEmailVerified: isEmailVerified ?? true,
        },
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      },
      process.env.NEXTAUTH_SECRET || 'test-secret',
      { algorithm: 'HS256' }
    );

    // Set the token in a cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', testToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return createApiResponse.success(
      { email, role, status, isEmailVerified },
      'Test user session created'
    );
  } catch (error) {
    console.error('Test auth error:', error);
    return createApiResponse.internalError('Failed to create test session');
  }
}

export async function DELETE() {
  try {
    // Clear the test session
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');

    return createApiResponse.success(null, 'Test user session cleared');
  } catch (error) {
    console.error('Test auth clear error:', error);
    return createApiResponse.internalError('Failed to clear test session');
  }
}
