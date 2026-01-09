import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import { prisma } from '@/lib/db';
import { Readable } from 'stream';

export interface DriveFile {
  id: string;
  name: string;
  size: string;
  createdTime: string;
  webViewLink: string;
}

export class GoogleDriveService {
  private drive: drive_v3.Drive | null = null;
  private authenticated = false;

  constructor() {
    // Authentication happens on first use
  }

  /**
   * Authenticate with Google Drive using OAuth 2.0
   */
  private async authenticate(): Promise<void> {
    if (this.authenticated && this.drive) {
      return;
    }

    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error(
          'Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
        );
      }

      // Get the most recent OAuth token from database
      const tokenRecord = await prisma.googleOAuthToken.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (!tokenRecord) {
        throw new Error(
          'Google Drive not connected. Please connect your Google Drive account from the admin dashboard.'
        );
      }

      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        process.env.NEXTAUTH_URL + '/api/admin/google-drive/callback'
      );

      // Check if token is expired or will expire in next 5 minutes
      const now = new Date();
      const expiresAt = new Date(tokenRecord.expiresAt);
      const shouldRefresh = expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

      if (shouldRefresh) {
        // Refresh the token
        oauth2Client.setCredentials({
          refresh_token: tokenRecord.refreshToken,
        });

        const { credentials } = await oauth2Client.refreshAccessToken();

        // Update token in database
        await prisma.googleOAuthToken.update({
          where: { id: tokenRecord.id },
          data: {
            accessToken: credentials.access_token!,
            expiresAt: new Date(credentials.expiry_date!),
          },
        });

        oauth2Client.setCredentials(credentials);
      } else {
        // Use existing token
        oauth2Client.setCredentials({
          access_token: tokenRecord.accessToken,
          refresh_token: tokenRecord.refreshToken,
        });
      }

      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
      this.authenticated = true;
    } catch (error) {
      throw new Error(
        `Failed to authenticate with Google Drive: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Upload backup file to Google Drive
   */
  async uploadBackup(
    fileBuffer: Buffer,
    filename: string,
    retries = 3
  ): Promise<{ fileId: string; webViewLink: string }> {
    await this.authenticate();

    if (!this.drive) {
      throw new Error('Google Drive not authenticated');
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        if (!rootFolderId) {
          throw new Error('GOOGLE_DRIVE_FOLDER_ID environment variable not set');
        }

        // Upload file directly to the shared root folder
        const fileMetadata = {
          name: filename,
          parents: [rootFolderId],
        };

        const media = {
          mimeType: 'application/gzip',
          body: Readable.from(fileBuffer),
        };

        const response = await this.drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id, webViewLink',
        });

        return {
          fileId: response.data.id!,
          webViewLink: response.data.webViewLink!,
        };
      } catch (error) {
        lastError = error as Error;

        if (attempt < retries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    throw new Error(
      `Failed to upload backup after ${retries} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * List backups from Google Drive
   */
  async listBackups(limit: number = 10): Promise<DriveFile[]> {
    await this.authenticate();

    if (!this.drive) {
      throw new Error('Google Drive not authenticated');
    }

    try {
      const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      if (!rootFolderId) {
        throw new Error('GOOGLE_DRIVE_FOLDER_ID environment variable not set');
      }

      const response = await this.drive.files.list({
        q: `'${rootFolderId}' in parents and mimeType='application/gzip' and trashed=false`,
        fields: 'files(id, name, size, createdTime, webViewLink)',
        orderBy: 'createdTime desc',
        pageSize: limit,
      });

      const files = response.data.files || [];

      return files.map(file => ({
        id: file.id!,
        name: file.name!,
        size: file.size || '0',
        createdTime: file.createdTime!,
        webViewLink: file.webViewLink!,
      }));
    } catch (error) {
      throw new Error(
        `Failed to list backups: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete old backups based on retention policy
   */
  async deleteOldBackups(retentionDays: number = 90): Promise<number> {
    await this.authenticate();

    if (!this.drive) {
      throw new Error('Google Drive not authenticated');
    }

    try {
      const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      if (!rootFolderId) {
        throw new Error('GOOGLE_DRIVE_FOLDER_ID environment variable not set');
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffISO = cutoffDate.toISOString();

      // Find old backup files
      const response = await this.drive.files.list({
        q: `'${rootFolderId}' in parents and mimeType='application/gzip' and createdTime < '${cutoffISO}' and trashed=false`,
        fields: 'files(id, name, createdTime)',
      });

      const files = response.data.files || [];
      let deletedCount = 0;

      for (const file of files) {
        try {
          await this.drive.files.delete({
            fileId: file.id!,
          });
          deletedCount++;
        } catch (_error) {
          // Continue with other files if one fails
        }
      }

      return deletedCount;
    } catch (error) {
      throw new Error(
        `Failed to delete old backups: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Download backup file from Google Drive
   */
  async downloadBackup(fileId: string): Promise<Buffer> {
    await this.authenticate();

    if (!this.drive) {
      throw new Error('Google Drive not authenticated');
    }

    try {
      const response = await this.drive.files.get(
        {
          fileId: fileId,
          alt: 'media',
        },
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data as ArrayBuffer);
    } catch (error) {
      throw new Error(
        `Failed to download backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test Google Drive connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();

      if (!this.drive) {
        return false;
      }

      // Just test if we can authenticate and call the Drive API
      // Don't test folder access - that will be checked when uploading
      await this.drive.about.get({
        fields: 'user',
      });

      return true;
    } catch (_error) {
      // Silent failure - connection test failed
      return false;
    }
  }

  /**
   * Test folder access and permissions
   */
  async testFolderAccess(): Promise<{
    canAccess: boolean;
    canWrite: boolean;
    folderName?: string;
    permissions?: string[];
    error?: string;
  }> {
    try {
      await this.authenticate();

      if (!this.drive) {
        return {
          canAccess: false,
          canWrite: false,
          error: 'Drive not authenticated',
        };
      }

      const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      if (!rootFolderId) {
        return {
          canAccess: false,
          canWrite: false,
          error: 'GOOGLE_DRIVE_FOLDER_ID not set',
        };
      }

      // Get folder metadata
      const folderResponse = await this.drive.files.get({
        fileId: rootFolderId,
        fields: 'id, name, capabilities, permissions',
      });

      const capabilities = folderResponse.data.capabilities;
      const canWrite = capabilities?.canAddChildren ?? false;

      return {
        canAccess: true,
        canWrite,
        folderName: folderResponse.data.name || 'Unknown',
        permissions: capabilities
          ? Object.entries(capabilities)
              .filter(([_, value]) => value === true)
              .map(([key]) => key)
          : [],
      };
    } catch (error) {
      return {
        canAccess: false,
        canWrite: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user information from the authenticated Google account
   */
  async getUserInfo(): Promise<{ email: string; name: string } | null> {
    try {
      await this.authenticate();

      if (!this.drive) {
        return null;
      }

      const about = await this.drive.about.get({
        fields: 'user(emailAddress, displayName)',
      });

      return {
        email: about.data.user?.emailAddress || '',
        name: about.data.user?.displayName || '',
      };
    } catch (error) {
      return null;
    }
  }
}
