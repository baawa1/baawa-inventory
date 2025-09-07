'use client';
import * as React from 'react';
import { auditLogColumns } from '@/components/admin/AuditLogTable';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { MobileDashboardFiltersBar, FilterConfig } from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';
import { useAuditLogs, type AuditLog } from '@/hooks/api/audit-logs';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

// Icons
import { IconClipboardList, IconUser, IconClock } from '@tabler/icons-react';

export default function MobileAuditLogsPage() {
  const searchParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null;
  const initialUserId = searchParams?.get('userId') || '';

  const [page, setPage] = React.useState(1);
  const [user, setUser] = React.useState(initialUserId);
  const [action, setAction] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [pageSize, setPageSize] = React.useState(10);
  const [visibleColumns, setVisibleColumns] = React.useState(() =>
    auditLogColumns.filter(c => c.required).map(c => c.key)
  );

  // Use TanStack Query hook instead of useEffect+fetch
  const {
    data,
    isLoading: loading,
    error,
  } = useAuditLogs({
    page,
    limit: pageSize,
    userId: user || undefined,
    action: action || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  // Handle errors (TanStack Query will show error in console, but we can add user-friendly handling)
  if (error) {
    logger.error('Failed to fetch audit logs', {
      error: error instanceof Error ? error.message : String(error),
    });
    toast.error('Failed to load audit logs');
  }

  // Filters config for MobileDashboardFiltersBar
  const filters: FilterConfig[] = [
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
  ];
  
  const filterValues = { user, action, from, to };
  
  const onFilterChange = (key: string, value: unknown) => {
    const stringValue = String(value);
    if (key === 'user' && user !== stringValue) setUser(stringValue);
    if (key === 'action' && action !== stringValue) setAction(stringValue);
    if (key === 'from' && from !== stringValue) setFrom(stringValue);
    if (key === 'to' && to !== stringValue) setTo(stringValue);
    setPage(1);
  };
  
  const onResetFilters = () => {
    setUser('');
    setAction('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  // Mobile-optimized columns with bold headers
  const mobileAuditLogColumns = auditLogColumns.map(col => ({
    ...col,
    className: 'font-bold'
  }));

  // Table cell renderer
  const renderCell = (log: AuditLog, columnKey: string) => {
    switch (columnKey) {
      case 'created_at':
        return (
          <span className="text-xs sm:text-sm">
            {new Date(log.created_at).toLocaleString()}
          </span>
        );
      case 'users':
        return (
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-medium truncate">
              {log.users
                ? `${log.users.firstName} ${log.users.lastName}`
                : 'System'}
            </div>
            {log.users && (
              <div className="text-xs text-muted-foreground truncate">
                {log.users.email}
              </div>
            )}
          </div>
        );
      case 'action':
        return (
          <Badge variant="outline" className="text-xs">
            {log.action}
          </Badge>
        );
      case 'table_name':
        return (
          <span className="text-xs sm:text-sm font-mono">
            {log.table_name}
          </span>
        );
      case 'record_id':
        return (
          <span className="text-xs sm:text-sm font-mono">
            {log.record_id ?? '-'}
          </span>
        );
      case 'ip_address':
        return (
          <span className="text-xs sm:text-sm font-mono">
            {log.ip_address ?? '-'}
          </span>
        );
      case 'user_agent':
        return (
          <span className="text-xs truncate max-w-32" title={log.user_agent ?? '-'}>
            {log.user_agent ?? '-'}
          </span>
        );
      case 'old_values':
        return (
          <span className="text-xs truncate max-w-32" title={log.old_values ? JSON.stringify(log.old_values) : '-'}>
            {log.old_values ? JSON.stringify(log.old_values) : '-'}
          </span>
        );
      case 'new_values':
        return (
          <span className="text-xs truncate max-w-32" title={log.new_values ? JSON.stringify(log.new_values) : '-'}>
            {log.new_values ? JSON.stringify(log.new_values) : '-'}
          </span>
        );
      default:
        return <span className="text-xs sm:text-sm">-</span>;
    }
  };

  // Mobile card title and subtitle
  const mobileCardTitle = (log: AuditLog) => (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
        <IconClipboardList className="h-5 w-5 text-blue-600" />
      </div>
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">
        {log.action} on {log.table_name}
      </span>
    </div>
  );

  const mobileCardSubtitle = (log: AuditLog) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <IconClock className="h-3 w-3" />
      <span>{new Date(log.created_at).toLocaleString()}</span>
      {log.users && (
        <>
          <span>•</span>
          <IconUser className="h-3 w-3" />
          <span className="truncate">
            {log.users.firstName} {log.users.lastName}
          </span>
        </>
      )}
      {log.record_id && (
        <>
          <span>•</span>
          <span className="font-mono">ID: {log.record_id}</span>
        </>
      )}
    </div>
  );

  return (
    <DashboardPageLayout
      title="Audit Logs"
      description="View and filter all system audit logs and user activity"
    >
      <div className="space-y-6">
        {/* Mobile-optimized Filters */}
        <MobileDashboardFiltersBar
          searchPlaceholder="Search audit logs..."
          searchValue=""
          onSearchChange={() => {}} // No search for audit logs
          filters={filters}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onResetFilters={onResetFilters}
        />

        {/* Mobile-optimized Table */}
        <MobileDashboardTable
          tableTitle="Audit Log Results"
          totalCount={totalPages * pageSize}
          currentCount={logs.length}
          columns={mobileAuditLogColumns}
          visibleColumns={visibleColumns}
          onColumnsChange={setVisibleColumns}
          columnCustomizerKey="audit-log-columns"
          data={logs}
          renderCell={renderCell}
          pagination={{
            page,
            limit: pageSize,
            totalPages,
            totalItems: totalPages * pageSize,
          }}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          isLoading={loading}
          emptyStateIcon={
            <IconClipboardList className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          }
          emptyStateMessage="No audit logs found"
          mobileCardTitle={mobileCardTitle}
          mobileCardSubtitle={mobileCardSubtitle}
          keyExtractor={log => log.id}
        />
      </div>
    </DashboardPageLayout>
  );
}