import { NextRequest, NextResponse } from 'next/server';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { BackupService } from '@/lib/services/backup-service';

/**
 * GET /api/admin/backup/history
 * Get backup history (admin only)
 */
export const GET = withPermission(
  ['ADMIN'],
  async function (request: AuthenticatedRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10', 10);

      const backupService = new BackupService();
      const backups = await backupService.getBackupHistory(limit);

      // Format the response
      const formattedBackups = backups.map(backup => ({
        id: backup.id,
        status: backup.status,
        triggerType: backup.triggerType,
        startedAt: backup.startedAt,
        completedAt: backup.completedAt,
        fileSize: backup.fileSize ? Number(backup.fileSize) : null,
        tablesCount: backup.tablesCount,
        recordsCount: backup.recordsCount,
        driveFileId: backup.driveFileId,
        driveFileUrl: backup.driveFileUrl,
        errorMessage: backup.errorMessage,
        createdBy: backup.createdByUser
          ? {
              firstName: backup.createdByUser.firstName,
              lastName: backup.createdByUser.lastName,
              email: backup.createdByUser.email,
            }
          : null,
      }));

      return NextResponse.json({
        success: true,
        backups: formattedBackups,
      });
    } catch (error) {
      console.error('[Admin Backup] Error fetching history:', error);

      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);
