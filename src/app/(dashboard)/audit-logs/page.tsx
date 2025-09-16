'use client';
import * as React from 'react';
import { auditLogColumns } from '@/components/admin/AuditLogTable';

// Hooks
import { useAuditLogs, type AuditLog } from '@/hooks/api/audit-logs';
import { useTableState } from '@/hooks/useTableState';

// Mobile-optimized components
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { MobileDashboardFiltersBar, FilterConfig } from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

// Shared utilities
import { MobileCardTitle, IconWrapper, MobileCardSubtitle } from '@/components/ui/mobile-card-templates';
import { TruncatedText } from '@/lib/utils/text-utils';

// Icons
import { IconFileText, IconUser, IconCalendar, IconShield } from '@tabler/icons-react';
import { SortOption } from '@/types/inventory';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface AuditLogFilters {
  search: string;
  user: string;
  action: string;
  from: string;
  to: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'created_at-desc', label: 'Newest First' },
  { value: 'created_at-asc', label: 'Oldest First' },
  { value: 'action-asc', label: 'Action (A-Z)' },
  { value: 'action-desc', label: 'Action (Z-A)' },
];

export default function AuditLogsPage() {
  const searchParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null;
  const initialUserId = searchParams?.get('userId') || '';

  // Use unified table state hook
  const {
    filters,
    apiFilters,
    pagination,
    visibleColumns,
    isSearching,
    currentSort,
    handleFilterChange,
    handleResetFilters,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    updatePaginationFromAPI,
    setVisibleColumns,
  } = useTableState<AuditLogFilters>({
    initialFilters: {
      search: '',
      user: initialUserId,
      action: '',
      from: '',
      to: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
    initialVisibleColumns: auditLogColumns.filter(c => c.required).map(c => c.key),
  });

  // Use TanStack Query hook
  const {
    data,
    isLoading,
    error,
  } = useAuditLogs({
    page: pagination.page,
    limit: pagination.limit,
    userId: apiFilters.user || undefined,
    action: apiFilters.action || undefined,
    from: apiFilters.from || undefined,
    to: apiFilters.to || undefined,
  });

  const logs = React.useMemo(() => data?.logs || [], [data?.logs]);

  // Update pagination state when API response changes
  React.useEffect(() => {
    if (data) {
      updatePaginationFromAPI({
        totalPages: data.totalPages,
        total: data.totalPages * pagination.limit,
      });
    }
  }, [data, updatePaginationFromAPI, pagination.limit]);

  // Handle errors (TanStack Query will show error in console, but we can add user-friendly handling)
  if (error) {
    logger.error('Failed to fetch audit logs', {
      error: error instanceof Error ? error.message : String(error),
    });
    toast.error('Failed to load audit logs');
  }

  // Filters config
  const filterConfigs: FilterConfig[] = React.useMemo(() => [
    {
      key: 'user',
      label: 'User ID',
      type: 'text',
      placeholder: 'User ID',
    },
    {
      key: 'action',
      label: 'Action',
      type: 'text',
      placeholder: 'Action',
    },
    {
      key: 'from',
      label: 'From',
      type: 'text',
      placeholder: 'From (YYYY-MM-DD)',
    },
    {
      key: 'to',
      label: 'To',
      type: 'text',
      placeholder: 'To (YYYY-MM-DD)',
    },
  ], []);

  // Filter available columns
  const availableColumns = React.useMemo(() => {
    return auditLogColumns.filter(_column => {
      return true; // No special permission filtering for audit logs
    });
  }, []);

  // Table cell renderer
  const renderCell = React.useCallback((log: AuditLog, columnKey: string) => {
    switch (columnKey) {
      case 'created_at':
        return <span className="text-xs sm:text-sm">{new Date(log.created_at).toLocaleString()}</span>;
      case 'users':
        return (
          <div className="min-w-0">
            {log.users ? (
              <>
                <div className="font-medium truncate text-xs sm:text-sm">
                  {log.users.firstName} {log.users.lastName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {log.users.email}
                </div>
              </>
            ) : (
              <span className="text-xs sm:text-sm text-muted-foreground">Unknown User</span>
            )}
          </div>
        );
      case 'action':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {log.action}
          </span>
        );
      case 'table_name':
        return <span className="text-xs sm:text-sm font-mono">{log.table_name}</span>;
      case 'record_id':
        return <span className="text-xs sm:text-sm font-mono">{log.record_id ?? '-'}</span>;
      case 'ip_address':
        return <span className="text-xs sm:text-sm font-mono">{log.ip_address ?? '-'}</span>;
      case 'user_agent':
        return (
          <TruncatedText 
            text={log.user_agent || '-'} 
            maxLength={30} 
            className="text-xs sm:text-sm text-muted-foreground"
          />
        );
      case 'old_values':
        return (
          <TruncatedText 
            text={log.old_values ? JSON.stringify(log.old_values) : '-'} 
            maxLength={50} 
            className="text-xs sm:text-sm font-mono"
          />
        );
      case 'new_values':
        return (
          <TruncatedText 
            text={log.new_values ? JSON.stringify(log.new_values) : '-'} 
            maxLength={50} 
            className="text-xs sm:text-sm font-mono"
          />
        );
      default:
        return <span className="text-xs sm:text-sm">-</span>;
    }
  }, []);

  // Mobile card title and subtitle
  const mobileCardTitle = React.useCallback((log: AuditLog) => (
    <MobileCardTitle
      icon={
        <IconWrapper 
          bgColor="bg-slate-100" 
          textColor="text-slate-600"
          size="md"
        >
          <IconShield className="w-5 h-5" />
        </IconWrapper>
      }
      title={log.action}
      subtitle={log.table_name ? `Table: ${log.table_name}` : undefined}
    >
      <div className="flex items-center gap-2 mt-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <IconCalendar className="w-3 h-3" />
          <span>{new Date(log.created_at).toLocaleDateString()}</span>
        </div>
        {log.users && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconUser className="w-3 h-3" />
            <span>{log.users.firstName} {log.users.lastName}</span>
          </div>
        )}
      </div>
    </MobileCardTitle>
  ), []);

  const mobileCardSubtitle = React.useCallback((log: AuditLog) => {
    const items = [
      {
        label: 'Time',
        value: new Date(log.created_at).toLocaleTimeString(),
        icon: <IconCalendar className="w-3 h-3" />,
      },
    ];

    if (log.record_id) {
      items.push({
        label: 'Record ID',
        value: log.record_id.toString(),
      } as any);
    }

    if (log.ip_address) {
      items.push({
        label: 'IP',
        value: log.ip_address,
      } as any);
    }

    return (
      <MobileCardSubtitle
        items={items}
      />
    );
  }, []);

  return (
    <DashboardPageLayout
      title="Audit Logs"
      description="View and filter all system audit logs and user activity"
    >
      <div className="space-y-6">
        {/* Mobile-optimized Filters */}
        <MobileDashboardFiltersBar
          searchPlaceholder="Search audit logs..."
          searchValue={filters.search}
          onSearchChange={value => handleFilterChange('search', value)}
          isSearching={isSearching}
          filters={filterConfigs}
          filterValues={filters as unknown as Record<string, unknown>}
          onFilterChange={(key: string, value: unknown) =>
            handleFilterChange(key as keyof AuditLogFilters, value as string | boolean)
          }
          onResetFilters={handleResetFilters}
          sortOptions={SORT_OPTIONS}
          currentSort={currentSort}
          onSortChange={handleSortChange}
        />

        {/* Mobile-optimized Table */}
        <MobileDashboardTable
          tableTitle="Audit Logs"
          totalCount={pagination.totalItems}
          currentCount={logs.length}
          columns={availableColumns}
          visibleColumns={visibleColumns}
          onColumnsChange={setVisibleColumns}
          columnCustomizerKey="audit-log-columns"
          data={logs}
          renderCell={renderCell}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
          error={error?.message}
          emptyStateIcon={
            <IconFileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          }
          emptyStateMessage="No audit logs found"
          mobileCardTitle={mobileCardTitle}
          mobileCardSubtitle={mobileCardSubtitle}
          keyExtractor={log => log.id.toString()}
        />
      </div>
    </DashboardPageLayout>
  );
}
