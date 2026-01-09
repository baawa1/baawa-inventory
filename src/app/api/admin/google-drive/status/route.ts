import { NextResponse } from 'next/server';
import { auth } from '@/../auth';
import { prisma } from '@/lib/db';
import { GoogleDriveService } from '@/lib/services/google-drive-service';

/**
 * GET /api/admin/google-drive/status
 * Check Google Drive connection status (admin only)
 */
export async function GET() {
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

    // Check if OAuth token exists
    const tokenRecord = await prisma.googleOAuthToken.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!tokenRecord) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'Google Drive not connected',
      });
    }

    // Test connection
    const driveService = new GoogleDriveService();
    const isConnected = await driveService.testConnection();

    if (isConnected) {
      const userInfo = await driveService.getUserInfo();
      return NextResponse.json({
        success: true,
        connected: true,
        email: userInfo?.email || tokenRecord.email,
        connectedAt: tokenRecord.createdAt,
      });
    } else {
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'Connection test failed - may need to reconnect',
      });
    }
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check Google Drive connection status',
      },
      { status: 500 }
    );
  }
}
