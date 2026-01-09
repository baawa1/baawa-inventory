import { NextResponse } from 'next/server';
import { auth } from '@/../auth';
import { google } from 'googleapis';

/**
 * GET /api/admin/google-drive/authorize
 * Initiates Google OAuth flow (admin only)
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Admin access required',
        },
        { status: 403 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = (process.env.NEXTAUTH_URL || 'http://localhost:3000') + '/api/admin/google-drive/callback';

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google OAuth credentials not configured',
        },
        { status: 500 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required to get refresh token
      prompt: 'consent', // Force consent screen to get refresh token
      scope: [
        'https://www.googleapis.com/auth/drive.file', // Access to files created by the app
        'https://www.googleapis.com/auth/drive.metadata.readonly', // Read-only metadata access
      ],
      state: session.user.id.toString(), // Pass user ID in state
    });

    // Redirect to Google OAuth page
    return NextResponse.redirect(authUrl);
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate Google Drive authorization',
      },
      { status: 500 }
    );
  }
}
