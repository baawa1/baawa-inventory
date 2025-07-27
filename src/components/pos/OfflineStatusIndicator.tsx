/**
 * Offline Status Indicator Component
 * Displays network status and offline queue information
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  IconWifi,
  IconWifiOff,
  IconCloudUpload,
  IconClock,
  IconAlertTriangle,
  IconRefresh,
  IconDatabase,
  IconTrash,
} from '@tabler/icons-react';
import { useOffline, useOfflineStats } from '@/hooks/useOffline';
import { toast } from 'sonner';

interface OfflineStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineStatusIndicator({
  className = '',
  showDetails = false,
}: OfflineStatusIndicatorProps) {
  const {
    isOnline,
    isSlowConnection,
    networkStatus,
    queueStats,
    syncNow,
    cacheProducts,
    clearFailedTransactions,
    isSyncing,
    isCaching,
    error,
  } = useOffline();

  const { stats, refreshStats } = useOfflineStats();

  const handleSyncNow = async () => {
    try {
      const result = await syncNow();
      toast.success(
        `Sync complete: ${result.success} successful, ${result.failed} failed`
      );
    } catch (err) {
      toast.error(
        'Sync failed: ' + (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  };

  const handleCacheProducts = async () => {
    try {
      await cacheProducts();
      await refreshStats();
      toast.success('Products cached successfully');
    } catch (err) {
      toast.error(
        'Cache failed: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  };

  const handleClearFailed = async () => {
    try {
      await clearFailedTransactions();
      toast.success('Failed transactions cleared');
    } catch (err) {
      toast.error(
        'Clear failed: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (isSlowConnection) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSlowConnection) return 'Slow Connection';
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <IconWifiOff className="h-4 w-4" />;
    return <IconWifi className="h-4 w-4" />;
  };

  // Simple indicator for header/toolbar
  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-2 ${className}`}
                >
                  {getStatusIcon()}
                  <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
                  {queueStats.pendingTransactions > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 px-1 py-0 text-xs"
                    >
                      {queueStats.pendingTransactions}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Offline Status</DialogTitle>
                  <DialogDescription>
                    Network connectivity and offline queue status
                  </DialogDescription>
                </DialogHeader>
                <OfflineStatusDetails
                  isOnline={isOnline}
                  isSlowConnection={isSlowConnection}
                  networkStatus={networkStatus}
                  queueStats={queueStats}
                  stats={stats}
                  isSyncing={isSyncing}
                  isCaching={isCaching}
                  error={error}
                  onSyncNow={handleSyncNow}
                  onCacheProducts={handleCacheProducts}
                  onClearFailed={handleClearFailed}
                />
              </DialogContent>
            </Dialog>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStatusText()}</p>
            {queueStats.pendingTransactions > 0 && (
              <p>{queueStats.pendingTransactions} pending transactions</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full details view
  return (
    <OfflineStatusDetails
      isOnline={isOnline}
      isSlowConnection={isSlowConnection}
      networkStatus={networkStatus}
      queueStats={queueStats}
      stats={stats}
      isSyncing={isSyncing}
      isCaching={isCaching}
      error={error}
      onSyncNow={handleSyncNow}
      onCacheProducts={handleCacheProducts}
      onClearFailed={handleClearFailed}
      className={className}
    />
  );
}

interface OfflineStatusDetailsProps {
  isOnline: boolean;
  isSlowConnection: boolean;
  networkStatus: any;
  queueStats: any;
  stats: any;
  isSyncing: boolean;
  isCaching: boolean;
  error: string | null;
  onSyncNow: () => void;
  onCacheProducts: () => void;
  onClearFailed: () => void;
  className?: string;
}

function OfflineStatusDetails({
  isOnline,
  isSlowConnection,
  networkStatus,
  queueStats,
  stats,
  isSyncing,
  isCaching,
  error,
  onSyncNow,
  onCacheProducts,
  onClearFailed,
  className = '',
}: OfflineStatusDetailsProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Network Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <IconWifi className="h-5 w-5" />
            ) : (
              <IconWifiOff className="h-5 w-5" />
            )}
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Connection:</span>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {isOnline && (
            <div className="flex items-center justify-between">
              <span>Speed:</span>
              <Badge variant={isSlowConnection ? 'secondary' : 'default'}>
                {isSlowConnection ? 'Slow' : 'Good'}
              </Badge>
            </div>
          )}

          {networkStatus.connectionType && (
            <div className="flex items-center justify-between">
              <span>Type:</span>
              <span className="text-muted-foreground text-sm">
                {networkStatus.connectionType}
              </span>
            </div>
          )}

          {networkStatus.lastOfflineTime && (
            <div className="flex items-center justify-between">
              <span>Last Offline:</span>
              <span className="text-muted-foreground text-sm">
                {networkStatus.lastOfflineTime.toLocaleTimeString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <IconCloudUpload className="h-5 w-5" />
            Sync Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Pending:</span>
            <Badge
              variant={
                queueStats.pendingTransactions > 0 ? 'secondary' : 'default'
              }
            >
              {queueStats.pendingTransactions}
            </Badge>
          </div>

          {queueStats.failedTransactions > 0 && (
            <div className="flex items-center justify-between">
              <span>Failed:</span>
              <Badge variant="destructive">
                {queueStats.failedTransactions}
              </Badge>
            </div>
          )}

          {queueStats.lastSyncAttempt && (
            <div className="flex items-center justify-between">
              <span>Last Sync:</span>
              <span className="text-muted-foreground text-sm">
                {queueStats.lastSyncAttempt.toLocaleTimeString()}
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={onSyncNow}
              disabled={
                !isOnline || isSyncing || queueStats.pendingTransactions === 0
              }
              className="flex-1"
            >
              {isSyncing ? (
                <>
                  <IconRefresh className="mr-1 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <IconRefresh className="mr-1 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>

            {queueStats.failedTransactions > 0 && (
              <Button size="sm" variant="outline" onClick={onClearFailed}>
                <IconTrash className="mr-1 h-4 w-4" />
                Clear Failed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Offline Storage */}
      {stats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <IconDatabase className="h-5 w-5" />
              Offline Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Cached Products:</span>
              <span className="text-muted-foreground text-sm">
                {stats.cachedProducts}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Total Transactions:</span>
              <span className="text-muted-foreground text-sm">
                {stats.totalTransactions}
              </span>
            </div>

            {stats.lastSync && (
              <div className="flex items-center justify-between">
                <span>Last Cache Update:</span>
                <span className="text-muted-foreground text-sm">
                  {stats.lastSync.toLocaleDateString()}
                </span>
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={onCacheProducts}
              disabled={!isOnline || isCaching}
              className="mt-2 w-full"
            >
              {isCaching ? (
                <>
                  <IconRefresh className="mr-1 h-4 w-4 animate-spin" />
                  Caching...
                </>
              ) : (
                <>
                  <IconDatabase className="mr-1 h-4 w-4" />
                  Update Cache
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-600">
              <IconAlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Offline Mode Tips */}
      {!isOnline && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="mb-2 flex items-center gap-2 text-blue-600">
              <IconClock className="h-4 w-4" />
              <span className="text-sm font-medium">Offline Mode</span>
            </div>
            <ul className="space-y-1 text-sm text-blue-600">
              <li>• Transactions will be saved locally</li>
              <li>• Use cached products for sales</li>
              <li>• Data will sync when back online</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
