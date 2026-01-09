import { NextRequest, NextResponse } from 'next/server';
import { BackupService } from '@/lib/services/backup-service';

// Vercel Pro allows up to 300 seconds for cron jobs
export const maxDuration = 300;

/**
 * POST /api/cron/backup
 * Automated backup endpoint triggered by Vercel Cron
 * Secured with CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('[Cron Backup] CRON_SECRET environment variable not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedAuth) {
      console.error('[Cron Backup] Invalid authorization header');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron Backup] Starting automated backup...');

    // Create backup
    const backupService = new BackupService();
    const result = await backupService.createAutomatedBackup();

    console.log('[Cron Backup] Backup completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Backup completed successfully',
      backupId: result.id,
      status: result.status,
      fileSize: result.fileSize,
      driveFileId: result.driveFileId,
    });
  } catch (error) {
    console.error('[Cron Backup] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
