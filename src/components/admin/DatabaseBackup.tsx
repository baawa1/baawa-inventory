'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InlineLoading, Spinner } from '@/components/ui/loading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IconDatabase,
  IconDownload,
  IconRefresh,
  IconCheck,
  IconX,
  IconClock,
  IconAlertCircle,
  IconBrandGoogle,
  IconPlugConnected,
  IconPlugConnectedX,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BackupLog {
  id: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  triggerType: 'MANUAL' | 'SCHEDULED' | 'API';
  startedAt: string;
  completedAt: string | null;
  fileSize: number | null;
  tablesCount: number | null;
  driveFileId: string | null;
  errorMessage: string | null;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface GoogleDriveStatus {
  connected: boolean;
  email?: string;
  connectedAt?: string;
  message?: string;
}

export function DatabaseBackup() {
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [driveStatus, setDriveStatus] = useState<GoogleDriveStatus | null>(null);
  const [checkingDriveStatus, setCheckingDriveStatus] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDriveWarning, setShowDriveWarning] = useState(false);

  // Fetch backup history
  const fetchBackupHistory = async () => {
    try {
      setFetchingHistory(true);
      const response = await fetch('/api/admin/backup/history?limit=10');
      const data = await response.json();

      if (data.success) {
        setBackups(data.backups);
      } else {
        toast.error('Failed to load backup history');
      }
    } catch (error) {
      toast.error('Failed to load backup history');
    } finally {
      setFetchingHistory(false);
    }
  };

  // Check Google Drive connection status
  const checkDriveStatus = async () => {
    try {
      setCheckingDriveStatus(true);
      const response = await fetch('/api/admin/google-drive/status');
      const data = await response.json();

      if (data.success) {
        setDriveStatus({
          connected: data.connected,
          email: data.email,
          connectedAt: data.connectedAt,
          message: data.message,
        });
      }
    } catch (error) {
      // Silent failure - status check failed
    } finally {
      setCheckingDriveStatus(false);
    }
  };

  // Connect to Google Drive
  const handleConnectDrive = () => {
    // Redirect to OAuth authorization endpoint
    window.location.href = '/api/admin/google-drive/authorize';
  };

  // Disconnect from Google Drive
  const handleDisconnectDrive = async () => {
    if (!confirm('Are you sure you want to disconnect Google Drive? Backups will fail until reconnected.')) {
      return;
    }

    try {
      setDisconnecting(true);
      const response = await fetch('/api/admin/google-drive/disconnect', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Google Drive disconnected successfully');
        await checkDriveStatus();
      } else {
        toast.error(data.error || 'Failed to disconnect Google Drive');
      }
    } catch (error) {
      toast.error('Failed to disconnect Google Drive');
    } finally {
      setDisconnecting(false);
    }
  };

  useEffect(() => {
    fetchBackupHistory();
    checkDriveStatus();

    // Check for OAuth callback success/error in URL
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success === 'oauth_connected') {
      toast.success('Google Drive connected successfully!');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      checkDriveStatus();
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_cancelled: 'Google Drive connection cancelled',
        oauth_config: 'OAuth configuration error - check environment variables',
        oauth_tokens: 'Failed to obtain OAuth tokens',
        oauth_error: 'Failed to connect to Google Drive',
      };
      toast.error(errorMessages[error] || decodeURIComponent(error));
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Create manual backup
  const handleCreateBackup = async () => {
    // Check if Google Drive is connected before starting backup
    if (!driveStatus?.connected) {
      setShowDriveWarning(true);
      return;
    }

    try {
      setLoading(true);
      toast.info('Creating backup... This may take a few minutes.');

      const response = await fetch('/api/admin/backup/create', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Backup created successfully!');
        // Refresh backup history
        await fetchBackupHistory();
      } else {
        toast.error(data.error || 'Failed to create backup');
      }
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  // Download backup
  const handleDownloadBackup = async (backupId: number) => {
    try {
      toast.info('Downloading backup...');

      const response = await fetch(`/api/admin/backup/download/${backupId}`);

      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${backupId}.json.gz`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Backup downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download backup');
    }
  };

  // Get status badge
  const getStatusBadge = (status: BackupLog['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <IconCheck className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Spinner size="sm" />
            In Progress
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <IconX className="h-3 w-3" />
            Failed
          </Badge>
        );
      case 'PARTIAL':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-600">
            <IconAlertCircle className="h-3 w-3" />
            Partial
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <IconClock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  // Format file size
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  // Calculate duration
  const calculateDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return 'N/A';
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const seconds = (end - start) / 1000;
    return `${seconds.toFixed(1)}s`;
  };

  const lastBackup = backups[0];

  return (
    <div className="space-y-6">
      {/* Google Drive Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBrandGoogle className="h-5 w-5" />
            Google Drive Connection
          </CardTitle>
          <CardDescription>
            Connect your Google Drive account to enable automated backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checkingDriveStatus ? (
            <InlineLoading label="Checking connection status..." />
          ) : driveStatus?.connected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                  <IconPlugConnected className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Connected</span>
                    <Badge variant="default" className="bg-green-600">
                      <IconCheck className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {driveStatus.email && (
                      <>
                        Connected as <span className="font-medium">{driveStatus.email}</span>
                      </>
                    )}
                    {driveStatus.connectedAt && (
                      <> · Connected {format(new Date(driveStatus.connectedAt), 'MMM dd, yyyy')}</>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleDisconnectDrive}
                isLoading={disconnecting}
                loadingText="Disconnecting..."
              >
                <IconPlugConnectedX className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-800">
                  <IconPlugConnectedX className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Not Connected</span>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                      <IconAlertCircle className="mr-1 h-3 w-3" />
                      Setup Required
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {driveStatus?.message || 'Connect your Google Drive to enable backups'}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleConnectDrive}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <IconBrandGoogle className="mr-2 h-4 w-4" />
                Connect Google Drive
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconDatabase className="h-5 w-5" />
                Database Backup Management
              </CardTitle>
              <CardDescription>
                Automated weekly backups to Google Drive with manual backup option
              </CardDescription>
            </div>
            <Button
              onClick={handleCreateBackup}
              size="lg"
              isLoading={loading}
              loadingText="Creating..."
            >
              <IconDatabase className="mr-2 h-4 w-4" />
              Create Manual Backup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">
                Last Backup
              </div>
              <div className="mt-1 text-2xl font-bold">
                {lastBackup
                  ? format(new Date(lastBackup.startedAt), 'MMM dd, yyyy')
                  : 'No backups yet'}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {lastBackup
                  ? format(new Date(lastBackup.startedAt), 'h:mm a')
                  : ''}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">
                Total Backups
              </div>
              <div className="mt-1 text-2xl font-bold">{backups.length}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {backups.filter(b => b.status === 'COMPLETED').length} successful
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">
                Last Backup Size
              </div>
              <div className="mt-1 text-2xl font-bold">
                {lastBackup ? formatFileSize(lastBackup.fileSize) : 'N/A'}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {lastBackup?.tablesCount || 0} tables
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Backup History</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBackupHistory}
              isLoading={fetchingHistory}
              loadingText=""
            >
              <IconRefresh className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconDatabase className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No backups yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first backup or wait for the automated weekly backup
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map(backup => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(backup.startedAt), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(backup.startedAt), 'h:mm a')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {backup.triggerType === 'MANUAL'
                            ? 'Manual'
                            : 'Scheduled'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell>{formatFileSize(backup.fileSize)}</TableCell>
                      <TableCell>
                        {calculateDuration(backup.startedAt, backup.completedAt)}
                      </TableCell>
                      <TableCell>
                        {backup.createdBy ? (
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {backup.createdBy.firstName}{' '}
                              {backup.createdBy.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {backup.createdBy.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            System
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {backup.status === 'COMPLETED' && backup.driveFileId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadBackup(backup.id)}
                          >
                            <IconDownload className="h-4 w-4" />
                          </Button>
                        ) : backup.status === 'FAILED' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toast.error(
                                backup.errorMessage || 'Backup failed'
                              )
                            }
                          >
                            <IconAlertCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">About Database Backups</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-inside list-disc space-y-1">
            <li>Automated backups run every Monday at 10:00 AM</li>
            <li>All database tables are included in each backup</li>
            <li>Backups are compressed and uploaded to Google Drive</li>
            <li>Backup retention period: 90 days</li>
            <li>Download backups for local storage or restoration</li>
          </ul>
        </CardContent>
      </Card>

      {/* Google Drive Connection Warning Dialog */}
      <AlertDialog open={showDriveWarning} onOpenChange={setShowDriveWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconAlertCircle className="h-5 w-5 text-yellow-600" />
              Google Drive Not Connected
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <div className="space-y-3">
                <div>
                  You need to connect your Google Drive account before creating a backup.
                  Without Google Drive connection, the backup cannot be uploaded and will fail.
                </div>
                <div className="font-medium text-foreground">
                  Please connect to Google Drive first, then try creating the backup again.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDriveWarning(false);
                // Scroll to Google Drive connection card
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <IconBrandGoogle className="mr-2 h-4 w-4" />
              Connect Google Drive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
