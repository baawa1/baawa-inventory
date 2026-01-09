import { prisma } from '@/lib/db';
import { GoogleDriveService } from './google-drive-service';
import { gzip } from 'zlib';
import { promisify } from 'util';
import type { BackupStatus, BackupTrigger, Prisma } from '@prisma/client';

const gzipAsync = promisify(gzip);

interface BackupMetadata {
  version: string;
  timestamp: string;
  prismaVersion: string;
  totalTables: number;
  totalRecords: number;
  backupDuration: number;
  tableDetails: Record<string, { count: number; hasData: boolean }>;
  [key: string]: unknown;
}

interface TableExportResult {
  tableName: string;
  count: number;
  data: unknown[];
}

interface BackupData {
  metadata: BackupMetadata;
  tables: Record<string, { count: number; data: unknown[] }>;
}

export class BackupService {
  private readonly CHUNK_SIZE: number;
  private readonly MAX_RETRIES = 3;
  private readonly googleDrive: GoogleDriveService;

  // List of all tables to backup (using Prisma model names - singular)
  private readonly TABLES_TO_BACKUP = [
    'user',
    'supplier',
    'category',
    'brand',
    'product',
    'salesTransaction',
    'salesItem',
    'splitPayment',
    'transactionPayment',
    'stockAddition',
    'stockReconciliation',
    'stockReconciliationItem',
    'stockAdjustment',
    'stockTransaction',
    'auditLog',
    'aIContent',
    'rateLimit',
    'sessionBlacklist',
    'financialTransaction',
    'expenseDetail',
    'incomeDetail',
    'financialReport',
    'coupon',
    'customer',
    'transactionFee',
    'backupLog',
  ];

  constructor() {
    this.CHUNK_SIZE = parseInt(
      process.env.BACKUP_CHUNK_SIZE || '1000',
      10
    );
    this.googleDrive = new GoogleDriveService();
  }

  /**
   * Create an automated backup (triggered by cron)
   */
  async createAutomatedBackup(): Promise<{
    id: number;
    status: BackupStatus;
    fileSize?: number;
    driveFileId?: string | null;
  }> {
    return this.createBackup('SCHEDULED', null);
  }

  /**
   * Create a manual backup (triggered by admin)
   */
  async createManualBackup(userId: number): Promise<{
    id: number;
    status: BackupStatus;
    fileSize?: number;
    driveFileId?: string | null;
  }> {
    return this.createBackup('MANUAL', userId);
  }

  /**
   * Core backup creation logic
   */
  private async createBackup(
    triggerType: BackupTrigger,
    userId: number | null
  ): Promise<{
    id: number;
    status: BackupStatus;
    fileSize?: number;
    driveFileId?: string | null;
  }> {
    const startTime = Date.now();

    // Check for concurrent backups
    const inProgressBackup = await prisma.backupLog.findFirst({
      where: { status: 'IN_PROGRESS' },
    });

    if (inProgressBackup) {
      throw new Error(
        'Another backup is already in progress. Please wait for it to complete.'
      );
    }

    // Create backup log entry
    const backupLog = await prisma.backupLog.create({
      data: {
        status: 'IN_PROGRESS',
        triggerType,
        createdBy: userId,
        startedAt: new Date(),
      },
    });

    try {
      console.log(`[BackupService] Starting backup (ID: ${backupLog.id})`);

      // Export all tables
      const exportResults = await this.exportAllTables();

      // Calculate total records
      const totalRecords = exportResults.reduce(
        (sum, result) => sum + result.count,
        0
      );

      // Build backup data structure
      const backupData: BackupData = {
        metadata: {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          prismaVersion: '6.10.1',
          totalTables: exportResults.length,
          totalRecords,
          backupDuration: Date.now() - startTime,
          tableDetails: exportResults.reduce(
            (acc, result) => {
              acc[result.tableName] = {
                count: result.count,
                hasData: result.count > 0,
              };
              return acc;
            },
            {} as Record<string, { count: number; hasData: boolean }>
          ),
        },
        tables: exportResults.reduce(
          (acc, result) => {
            acc[result.tableName] = {
              count: result.count,
              data: result.data,
            };
            return acc;
          },
          {} as Record<string, { count: number; data: unknown[] }>
        ),
      };

      // Compress backup data
      console.log('[BackupService] Compressing backup data...');
      const compressed = await this.compressData(backupData);
      const fileSize = compressed.length;

      console.log(
        `[BackupService] Backup compressed: ${(fileSize / 1024 / 1024).toFixed(2)} MB`
      );

      // Upload to Google Drive
      const environment = process.env.NODE_ENV || 'development';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${environment}-${backupLog.id}-${timestamp}.json.gz`;

      let driveFileId: string | null = null;
      let driveFileUrl: string | null = null;
      let finalStatus: BackupStatus = 'COMPLETED';

      try {
        console.log('[BackupService] Uploading to Google Drive...');
        const uploadResult = await this.googleDrive.uploadBackup(
          compressed,
          filename
        );

        driveFileId = uploadResult.fileId;
        driveFileUrl = uploadResult.webViewLink;

        console.log(
          `[BackupService] Upload successful (File ID: ${driveFileId})`
        );

        // Clean up old backups
        const retentionDays = parseInt(
          process.env.BACKUP_RETENTION_DAYS || '90',
          10
        );
        await this.googleDrive.deleteOldBackups(retentionDays);
      } catch (uploadError) {
        console.error(
          '[BackupService] Google Drive upload failed:',
          uploadError
        );
        finalStatus = 'PARTIAL';
        // Continue - we still have the backup data even if upload failed
      }

      // Update backup log with results
      const updatedBackupLog = await prisma.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          fileSize: BigInt(fileSize),
          tablesCount: exportResults.length,
          recordsCount: backupData.metadata.tableDetails,
          driveFileId,
          driveFileUrl,
          metadata: backupData.metadata as Prisma.InputJsonValue,
        },
      });

      const duration = Date.now() - startTime;
      console.log(
        `[BackupService] Backup completed successfully (ID: ${backupLog.id}, Duration: ${(duration / 1000).toFixed(2)}s)`
      );

      return {
        id: updatedBackupLog.id,
        status: updatedBackupLog.status as BackupStatus,
        fileSize: Number(updatedBackupLog.fileSize),
        driveFileId: updatedBackupLog.driveFileId,
      };
    } catch (error) {
      // Mark backup as failed
      await prisma.backupLog.update({
        where: { id: backupLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        },
      });

      console.error('[BackupService] Backup failed:', error);
      throw error;
    }
  }

  /**
   * Export all database tables
   */
  private async exportAllTables(): Promise<TableExportResult[]> {
    const results: TableExportResult[] = [];

    for (const tableName of this.TABLES_TO_BACKUP) {
      try {
        const data = await this.exportTable(tableName);
        results.push({
          tableName,
          count: data.length,
          data,
        });

        console.log(
          `[BackupService] Exported table: ${tableName} (${data.length} records)`
        );
      } catch (error) {
        console.error(`[BackupService] Error exporting table ${tableName}:`, error);
        // Continue with other tables even if one fails
        results.push({
          tableName,
          count: 0,
          data: [],
        });
      }
    }

    return results;
  }

  /**
   * Export a single table with batching for large datasets
   */
  private async exportTable(tableName: string): Promise<unknown[]> {
    const model = (prisma as any)[tableName];

    if (!model) {
      console.warn(`[BackupService] Model not found: ${tableName}`);
      return [];
    }

    let allRecords: unknown[] = [];
    let cursor: unknown = undefined;
    let hasMore = true;

    // Use cursor-based pagination for efficient memory usage
    while (hasMore) {
      const records = await (model as any).findMany({
        take: this.CHUNK_SIZE,
        ...(cursor ? { skip: 1, cursor } : {}),
        orderBy: { id: 'asc' },
      });

      if (records.length === 0) {
        hasMore = false;
      } else {
        allRecords = allRecords.concat(records);

        if (records.length < this.CHUNK_SIZE) {
          hasMore = false;
        } else {
          cursor = { id: records[records.length - 1].id };
        }
      }
    }

    return allRecords;
  }

  /**
   * Compress backup data using gzip
   */
  private async compressData(data: BackupData): Promise<Buffer> {
    try {
      // Custom replacer to handle BigInt values
      const jsonString = JSON.stringify(
        data,
        (key, value) => {
          // Convert BigInt to string for JSON serialization
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        },
        0
      );
      const compressed = await gzipAsync(Buffer.from(jsonString, 'utf-8'));
      return compressed;
    } catch (error) {
      console.error('[BackupService] Compression failed:', error);
      throw new Error(
        `Failed to compress backup data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Download a backup file
   */
  async downloadBackup(backupId: number): Promise<Buffer> {
    const backupLog = await prisma.backupLog.findUnique({
      where: { id: backupId },
    });

    if (!backupLog) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    if (!backupLog.driveFileId) {
      throw new Error(`Backup ${backupId} has no associated Google Drive file`);
    }

    try {
      return await this.googleDrive.downloadBackup(backupLog.driveFileId);
    } catch (error) {
      console.error('[BackupService] Download failed:', error);
      throw new Error(
        `Failed to download backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get backup history
   */
  async getBackupHistory(limit: number = 10) {
    return prisma.backupLog.findMany({
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: {
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Test backup system (without creating actual backup)
   */
  async testBackupSystem(): Promise<{
    database: boolean;
    googleDrive: boolean;
    tables: number;
    estimatedRecords: number;
  }> {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      const databaseOk = true;

      // Test Google Drive connection
      const googleDriveOk = await this.googleDrive.testConnection();

      // Count tables and records
      let estimatedRecords = 0;
      let tablesAccessible = 0;

      for (const tableName of this.TABLES_TO_BACKUP) {
        try {
          const model = (prisma as any)[tableName];
          if (model) {
            const count = await (model as any).count();
            estimatedRecords += count;
            tablesAccessible++;
          }
        } catch (error) {
          console.error(`Error counting table ${tableName}:`, error);
        }
      }

      return {
        database: databaseOk,
        googleDrive: googleDriveOk,
        tables: tablesAccessible,
        estimatedRecords,
      };
    } catch (error) {
      console.error('[BackupService] Test failed:', error);
      throw error;
    }
  }
}
