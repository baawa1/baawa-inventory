import { NextResponse } from 'next/server';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { BackupService } from '@/lib/services/backup-service';
import { GoogleDriveService } from '@/lib/services/google-drive-service';
import { AuditLogger } from '@/lib/utils/audit-logger';

/**
 * POST /api/admin/backup/create
 * Create a manual backup (admin only)
 */
export const POST = withPermission(
  ['ADMIN'],
  async function (request: AuthenticatedRequest) {
    try {
      const userId = parseInt(request.user.id);

      console.log(`[Admin Backup] Manual backup requested by user ${userId}`);

      // Verify Google Drive connection before starting backup
      const googleDrive = new GoogleDriveService();
      const isConnected = await googleDrive.testConnection();

      if (!isConnected) {
        console.log('[Admin Backup] Google Drive not connected, backup aborted');

        await AuditLogger.logAuthEvent(
          {
            action: 'BACKUP_CREATED',
            userId,
            success: false,
            details: {
              error: 'Google Drive not connected',
            },
          },
          request
        );

        return NextResponse.json(
          {
            success: false,
            error: 'Google Drive not connected. Please connect your Google Drive account before creating a backup.',
          },
          { status: 400 }
        );
      }

      const backupService = new BackupService();
      const result = await backupService.createManualBackup(userId);

      // Log audit event
      await AuditLogger.logAuthEvent(
        {
          action: 'BACKUP_CREATED',
          userId,
          success: true,
          details: {
            backupId: result.id,
            status: result.status,
            fileSize: result.fileSize,
          },
        },
        request
      );

      return NextResponse.json({
        success: true,
        message: 'Backup created successfully',
        backup: {
          id: result.id,
          status: result.status,
          fileSize: result.fileSize,
          driveFileId: result.driveFileId,
        },
      });
    } catch (error) {
      console.error('[Admin Backup] Error creating backup:', error);

      // Log failed attempt
      await AuditLogger.logAuthEvent(
        {
          action: 'BACKUP_CREATED',
          userId: parseInt(request.user.id),
          success: false,
          details: {
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
