import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sign } from 'jsonwebtoken';
import { createApiResponse } from '@/lib/api-response';
import { envConfig } from '@/lib/config/env-validation';

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
    const { email, role, status, isEmailVerified } = await request.json();

    // Validate required fields
    if (!email || !role || !status) {
      return createApiResponse.validationError('Missing required fields');
    }

    // Ensure NEXTAUTH_SECRET is available in development
    const secret = envConfig.nextAuthSecret;
    if (!secret) {
      return createApiResponse.internalError('NEXTAUTH_SECRET not configured');
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
      secret,
      { algorithm: 'HS256' }
    );

    // Set the token in a cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', testToken, {
      httpOnly: true,
      secure: false, // Allow HTTP in development
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return createApiResponse.success(
      { email, role, status, isEmailVerified },
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
    // Clear the test session
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');

    return createApiResponse.success(null, 'Test user session cleared (development only)');
  } catch (error) {
    // Log only in development
    console.error('Test auth clear error:', error);
    return createApiResponse.internalError('Failed to clear test session');
  }
}