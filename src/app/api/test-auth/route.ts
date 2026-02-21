import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createApiResponse } from '@/lib/api-response';
import { envConfig } from '@/lib/config/env-validation';
import { encode } from 'next-auth/jwt';
import { authConfig } from '#root/auth.config';

export async function GET() {
  // Only allow in development
  if (!envConfig.isDevelopment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Test auth endpoint available in development' });
}

export async function POST(request: Request) {
  // Only allow in development
  if (!envConfig.isDevelopment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  try {
    const { id, email, role, status, isEmailVerified, firstName, lastName, isActive } =
      await request.json();

    // Validate required fields
    if (!email || !role || !status) {
      return createApiResponse.validationError('Missing required fields');
    }

    // Ensure NEXTAUTH_SECRET is available in development
    const secret = envConfig.nextAuthSecret;
    if (!secret) {
      return createApiResponse.internalError('NEXTAUTH_SECRET not configured');
    }

    const cookieName =
      authConfig.cookies?.sessionToken?.name || 'next-auth.session-token';

    const token = await encode({
      token: {
        sub: String(id || email),
        email,
        role,
        status,
        isEmailVerified: isEmailVerified ?? true,
        firstName: firstName || 'Test',
        lastName: lastName || 'User',
        isActive: isActive ?? true,
        userStatus: status,
        createdAt: new Date().toISOString(),
        dataFetchedAt: Date.now(),
      },
      secret,
      maxAge: 24 * 60 * 60,
      salt: cookieName,
    });

    // Set the session token cookie used by NextAuth
    const cookieStore = await cookies();
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: authConfig.cookies?.sessionToken?.options?.secure ?? false,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return createApiResponse.success(
      { id: id || email, email, role, status, isEmailVerified },
      'Test user session created (development only)'
    );
  } catch (error) {
    // Log only in development
    console.error('Test auth error:', error);
    return createApiResponse.internalError('Failed to create test session');
  }
}

export async function DELETE() {
  // Only allow in development
  if (!envConfig.isDevelopment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  try {
    const cookieName =
      authConfig.cookies?.sessionToken?.name || 'next-auth.session-token';

    // Clear the test session
    const cookieStore = await cookies();
    cookieStore.delete(cookieName);

    return createApiResponse.success(null, 'Test user session cleared (development only)');
  } catch (error) {
    // Log only in development
    console.error('Test auth clear error:', error);
    return createApiResponse.internalError('Failed to clear test session');
  }
}
