import { NextResponse } from 'next/server';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { GoogleDriveService } from '@/lib/services/google-drive-service';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/backup/test
 * Test Google Drive configuration (admin only)
 */
export const GET = withPermission(
  ['ADMIN'],
  async function (request: AuthenticatedRequest) {
    const results = {
      timestamp: new Date().toISOString(),
      checks: [] as Array<{
        name: string;
        status: 'pass' | 'fail' | 'warning';
        message: string;
        details?: any;
      }>,
    };

    // Check 1: Environment Variables
    const envVars = {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_DRIVE_FOLDER_ID: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      CRON_SECRET: !!process.env.CRON_SECRET,
    };

    const missingVars = Object.entries(envVars)
      .filter(([_, exists]) => !exists)
      .map(([name]) => name);

    if (missingVars.length === 0) {
      results.checks.push({
        name: 'Environment Variables',
        status: 'pass',
        message: 'All required environment variables are set',
      });
    } else {
      results.checks.push({
        name: 'Environment Variables',
        status: 'fail',
        message: `Missing environment variables: ${missingVars.join(', ')}`,
        details: envVars,
      });
    }

    // Check 2: OAuth Token Status
    try {
      const tokenRecord = await prisma.googleOAuthToken.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (tokenRecord) {
        const now = new Date();
        const expiresAt = new Date(tokenRecord.expiresAt);
        const isExpired = expiresAt.getTime() < now.getTime();

        results.checks.push({
          name: 'OAuth Token',
          status: isExpired ? 'warning' : 'pass',
          message: isExpired
            ? 'OAuth token expired - will refresh automatically'
            : 'OAuth token is valid',
          details: {
            connectedEmail: tokenRecord.email,
            connectedAt: tokenRecord.createdAt,
          },
        });
      } else {
        results.checks.push({
          name: 'OAuth Token',
          status: 'fail',
          message:
            'Google Drive not connected - please connect from admin dashboard',
        });
      }
    } catch (error) {
      results.checks.push({
        name: 'OAuth Token',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check 3: Google Drive Authentication
    try {
      const driveService = new GoogleDriveService();
      const isConnected = await driveService.testConnection();

      if (isConnected) {
        results.checks.push({
          name: 'Google Drive Authentication',
          status: 'pass',
          message: 'Successfully authenticated with Google Drive',
        });
      } else {
        results.checks.push({
          name: 'Google Drive Authentication',
          status: 'fail',
          message: 'Authentication failed - may need to reconnect',
        });
      }
    } catch (error) {
      results.checks.push({
        name: 'Google Drive Authentication',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check 4: Folder Access & Permissions
    try {
      const driveService = new GoogleDriveService();
      const testResult = await driveService.testFolderAccess();

      if (testResult.canAccess) {
        if (testResult.canWrite) {
          results.checks.push({
            name: 'Folder Permissions',
            status: 'pass',
            message: 'Folder is accessible and writable',
            details: {
              folderName: testResult.folderName,
              hasWriteAccess: true,
            },
          });
        } else {
          results.checks.push({
            name: 'Folder Permissions',
            status: 'warning',
            message: 'Folder is accessible but may not have write permissions',
            details: {
              folderName: testResult.folderName,
              hasWriteAccess: false,
            },
          });
        }
      } else {
        results.checks.push({
          name: 'Folder Permissions',
          status: 'fail',
          message: 'Cannot access folder - check folder ID or permissions',
          details: {
            error: testResult.error,
          },
        });
      }
    } catch (error) {
      results.checks.push({
        name: 'Folder Permissions',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Check 5: Upload Test (Small file)
    try {
      const driveService = new GoogleDriveService();
      const testData = Buffer.from(
        JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          message: 'This is a test backup file',
        })
      );

      const uploadResult = await driveService.uploadBackup(
        testData,
        `test-backup-${Date.now()}.json`
      );

      results.checks.push({
        name: 'File Upload Test',
        status: 'pass',
        message: 'Successfully uploaded test file to Google Drive',
        details: {
          fileId: uploadResult.fileId,
        },
      });
    } catch (error) {
      results.checks.push({
        name: 'File Upload Test',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Summary
    const passCount = results.checks.filter(c => c.status === 'pass').length;
    const failCount = results.checks.filter(c => c.status === 'fail').length;
    const warningCount = results.checks.filter(
      c => c.status === 'warning'
    ).length;

    const allPassed = failCount === 0 && warningCount === 0;

    return NextResponse.json({
      success: allPassed,
      summary: {
        total: results.checks.length,
        passed: passCount,
        failed: failCount,
        warnings: warningCount,
        ready: allPassed,
      },
      results,
      message: allPassed
        ? 'All checks passed! Your backup system is ready to use.'
        : 'Some checks failed. Please fix the issues above.',
    });
  }
);
