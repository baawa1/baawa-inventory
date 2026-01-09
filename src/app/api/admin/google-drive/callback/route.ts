import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/google-drive/callback
 * Handles OAuth callback from Google
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // User ID
    const error = searchParams.get('error');

    // Handle user cancellation
    if (error || !code || !state) {
      return NextResponse.redirect(
        new URL('/admin?tab=backup&error=oauth_cancelled', request.url)
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.NEXTAUTH_URL + '/api/admin/google-drive/callback';

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/admin?tab=backup&error=oauth_config', request.url)
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL('/admin?tab=backup&error=oauth_tokens', request.url)
      );
    }

    const userId = parseInt(state);
    const expiresAt = new Date(tokens.expiry_date || Date.now() + 3600 * 1000);

    // Get email from Drive API (we'll fetch it lazily later if needed)
    let userEmail: string | null = null;
    try {
      oauth2Client.setCredentials(tokens);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      const about = await drive.about.get({ fields: 'user(emailAddress)' });
      userEmail = about.data.user?.emailAddress || null;
    } catch (_error) {
      // Email fetch failed, but that's okay - we'll continue without it
      // Silent failure - email is optional
    }

    // Delete any existing tokens
    await prisma.googleOAuthToken.deleteMany({});

    // Store new tokens in database
    await prisma.googleOAuthToken.create({
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope || '',
        email: userEmail,
        createdBy: userId,
      },
    });

    // Redirect back to admin dashboard with success
    return NextResponse.redirect(
      new URL('/admin?tab=backup&success=oauth_connected', request.url)
    );
  } catch (_error) {
    return NextResponse.redirect(
      new URL('/admin?tab=backup&error=oauth_error', request.url)
    );
  }
}
