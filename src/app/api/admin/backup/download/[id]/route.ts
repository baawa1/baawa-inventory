import { NextResponse } from 'next/server';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { BackupService } from '@/lib/services/backup-service';
import { AuditLogger } from '@/lib/utils/audit-logger';
import { AuditLogAction } from '@/types/audit';

/**
 * GET /api/admin/backup/download/[id]
 * Download a backup file (admin only)
 */
export const GET = withPermission(
  ['ADMIN'],
  async function (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params;
      const backupId = parseInt(id, 10);

      if (isNaN(backupId)) {
        return NextResponse.json(
          { error: 'Invalid backup ID' },
          { status: 400 }
        );
      }

      console.log(
        `[Admin Backup] Download requested for backup ${backupId} by user ${request.user.id}`
      );

      const backupService = new BackupService();
      const fileBuffer = await backupService.downloadBackup(backupId);

      // Log audit event
      await AuditLogger.logAuthEvent(
        {
          action: AuditLogAction.BACKUP_DOWNLOADED,
          userId: parseInt(request.user.id),
          success: true,
          tableName: 'backup_logs',
          recordId: backupId,
          details: {
            backupId,
          },
        },
        request
      );

      // Return file with appropriate headers
      // Convert Buffer to Uint8Array for NextResponse compatibility
      const uint8Array = new Uint8Array(fileBuffer);

      return new NextResponse(uint8Array, {
        headers: {
          'Content-Type': 'application/gzip',
          'Content-Disposition': `attachment; filename="backup-${backupId}.json.gz"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch (error) {
      console.error('[Admin Backup] Error downloading backup:', error);

      // Log failed attempt
      const { id: failedId } = await params;
      await AuditLogger.logAuthEvent(
        {
          action: AuditLogAction.BACKUP_DOWNLOADED,
          userId: parseInt(request.user.id),
          success: false,
          tableName: 'backup_logs',
          details: {
            backupId: failedId,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        request
      );

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
