import { NextResponse } from 'next/server';
import { auth } from '@/../auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/google-drive/disconnect
 * Disconnect Google Drive (admin only)
 */
export async function POST() {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
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

    // Delete all OAuth tokens
    await prisma.googleOAuthToken.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'Google Drive disconnected successfully',
    });
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disconnect Google Drive',
      },
      { status: 500 }
    );
  }
}
