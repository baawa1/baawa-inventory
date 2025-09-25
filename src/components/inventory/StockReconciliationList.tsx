'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useStockReconciliations,
  useSubmitStockReconciliation,
  useApproveStockReconciliation,
  useRejectStockReconciliation,
  useDeleteStockReconciliation,
  type StockReconciliationFilters,
  type StockReconciliation as APIStockReconciliation,
} from '@/hooks/api/stock-management';
import { InventoryPageLayout } from '@/components/inventory/InventoryPageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconEye,
  IconCheck,
  IconX,
  IconTrash,
  IconSend,
  IconClipboard,
  IconAlertTriangle,
} from '@tabler/icons-react';
import type { FilterConfig } from '@/types/inventory';
import type { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';
import { logger } from '@/lib/logger';
import {
  calculateDiscrepancyMetrics,
  formatSignedUnits,
} from '@/lib/utils/stock-reconciliation';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface StockReconciliationListProps {
  user: User;
}

const StockReconciliationList = ({ user }: StockReconciliationListProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reconciliationToDelete, setReconciliationToDelete] =
    useState<APIStockReconciliation | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [reconciliationToReject, setReconciliationToReject] =
    useState<APIStockReconciliation | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Column configuration - only showing actual reconciliation fields
  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: 'title',
        label: 'Title',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      { key: 'status', label: 'Status', defaultVisible: true },
      { key: 'itemCount', label: 'Items', defaultVisible: true },
      { key: 'netDiscrepancy', label: 'Net', defaultVisible: true },
      { key: 'overageDiscrepancy', label: 'Overages', defaultVisible: true },
      { key: 'shortageDiscrepancy', label: 'Shortages', defaultVisible: true },
      { key: 'createdBy', label: 'Created By', defaultVisible: true },
      { key: 'createdAt', label: 'Created', defaultVisible: true },
      { key: 'updatedAt', label: 'Updated', defaultVisible: false },
    ],
    []
  );

  // Initialize visibleColumns with default values to prevent hydration mismatch
  const defaultVisibleColumns = useMemo(
    () => columns.filter(col => col.defaultVisible).map(col => col.key),
    [columns]
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    defaultVisibleColumns
  );

  // Clean up any "actions" column from localStorage and state - run once on mount
  React.useEffect(() => {
    const storageKey = 'stock-reconciliations-visible-columns';
    const storedColumns = localStorage.getItem(storageKey);
    if (!storedColumns) return;

    try {
      const parsed = JSON.parse(storedColumns);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(storageKey);
        return;
      }

      let updated = parsed.filter((col: string) => col !== 'actions');

      if (updated.includes('totalDiscrepancy')) {
        updated = updated.filter((col: string) => col !== 'totalDiscrepancy');
        ['netDiscrepancy', 'overageDiscrepancy', 'shortageDiscrepancy'].forEach(
          key => {
            if (!updated.includes(key)) {
              updated.push(key);
            }
          }
        );
      }

      localStorage.setItem(storageKey, JSON.stringify(updated));
      setVisibleColumns(updated);
    } catch (_error) {
      localStorage.removeItem(storageKey);
    }
  }, []);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks for data fetching
  const stockFilters: StockReconciliationFilters = {
    search: debouncedSearchTerm,
    status: filters.status !== '' ? filters.status : undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: pagination.page,
    limit: pagination.limit,
  };

  const reconciliationsQuery = useStockReconciliations(stockFilters);
  const submitReconciliation = useSubmitStockReconciliation();
  const approveReconciliation = useApproveStockReconciliation();
  const rejectReconciliation = useRejectStockReconciliation();
  const deleteReconciliation = useDeleteStockReconciliation();

  // Extract data from queries
  const reconciliations = reconciliationsQuery.data?.data || [];
  const loading = reconciliationsQuery.isLoading;
  const total = reconciliationsQuery.data?.pagination?.total || 0;
  const apiPagination = reconciliationsQuery.data?.pagination;

  // Update pagination state from API response
  const currentPagination = {
    page: apiPagination?.page || pagination.page,
    limit: apiPagination?.limit || pagination.limit,
    totalPages:
      apiPagination?.totalPages || Math.ceil(total / pagination.limit),
    totalItems: total,
  };

  // Permission checks
  const canManageReconciliations = ['ADMIN', 'MANAGER'].includes(user.role);

  // Filter configurations - memoized to prevent unnecessary re-renders
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'DRAFT', label: 'Draft' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
        ],
        placeholder: 'All Status',
      },
    ],
    []
  );

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => {
      if (prev[key as keyof typeof prev] === value) return prev; // Prevent unnecessary updates
      return { ...prev, [key]: value };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Clear all filters
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPagination(prev => ({ ...prev, limit: newSize, page: 1 }));
  }, []);

  // Handle submit for approval
  const handleSubmitForApproval = useCallback(
    async (reconciliationId: number) => {
      try {
        await submitReconciliation.mutateAsync(reconciliationId);
        toast.success('Reconciliation submitted for approval');
      } catch (error) {
        logger.error('Failed to submit reconciliation', {
          reconciliationId: reconciliationId,
          error: error instanceof Error ? error.message : String(error),
        });
        toast.error('Failed to submit reconciliation');
      }
    },
    [submitReconciliation]
  );

  // Handle approve
  const handleApprove = useCallback(
    async (reconciliationId: number) => {
      try {
        await approveReconciliation.mutateAsync({ id: reconciliationId });
        toast.success('Reconciliation approved successfully');
      } catch (error) {
        logger.error('Failed to approve reconciliation', {
          reconciliationId: reconciliationId,
          error: error instanceof Error ? error.message : String(error),
        });
        toast.error('Failed to approve reconciliation');
      }
    },
    [approveReconciliation]
  );

  // Handle reject
  const handleReject = useCallback((reconciliation: APIStockReconciliation) => {
    setReconciliationToReject(reconciliation);
    setRejectDialogOpen(true);
  }, []);

  // Handle reject confirmation
  const handleRejectConfirm = useCallback(async () => {
    if (!reconciliationToReject || !rejectReason.trim()) return;

    try {
      await rejectReconciliation.mutateAsync({
        id: reconciliationToReject.id,
        reason: rejectReason.trim(),
      });
      toast.success('Reconciliation rejected');
      setRejectDialogOpen(false);
      setReconciliationToReject(null);
      setRejectReason('');
    } catch (error) {
      logger.error('Failed to reject reconciliation', {
        reconciliationId: reconciliationToReject?.id,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to reject reconciliation');
    }
  }, [reconciliationToReject, rejectReason, rejectReconciliation]);

  // Handle delete reconciliation
  const handleDeleteReconciliation = useCallback(async () => {
    if (!reconciliationToDelete) return;

    try {
      await deleteReconciliation.mutateAsync(
        reconciliationToDelete.id.toString()
      );
      toast.success('Reconciliation deleted successfully');
    } catch (error) {
      logger.error('Failed to delete reconciliation', {
        reconciliationId: reconciliationToDelete?.id,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to delete reconciliation');
    } finally {
      setDeleteDialogOpen(false);
      setReconciliationToDelete(null);
    }
  }, [reconciliationToDelete, deleteReconciliation]);

  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge className="border-gray-200 bg-gray-100 text-gray-800">
            Draft
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="border-yellow-200 bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="border-green-200 bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="border-red-200 bg-red-100 text-red-800">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  const calculateMetrics = useCallback((reconciliation: APIStockReconciliation) => {
    const inputs = reconciliation.items.map(item => {
      let impact = 0;
      if (item.estimatedImpact !== null && item.estimatedImpact !== undefined) {
        impact =
          typeof item.estimatedImpact === 'string'
            ? parseFloat(item.estimatedImpact)
            : Number(item.estimatedImpact);

        if (Number.isNaN(impact)) {
          impact = 0;
        }
      }

      return {
        discrepancy: Number(item.discrepancy || 0),
        impact,
      };
    });

    return calculateDiscrepancyMetrics(inputs);
  }, []);

  // Add actions column if user has permissions
  const columnsWithActions = useMemo(() => {
    return columns;
  }, [columns]);

  // Ensure visibleColumns has default values if empty and filter out actions column
  const effectiveVisibleColumns = useMemo(() => {
    let columnsToShow = visibleColumns;

    if (visibleColumns.length === 0) {
      columnsToShow = columns
        .filter(col => col.defaultVisible)
        .map(col => col.key);
    }

    // Filter out any "actions" column since it's handled automatically by the table
    return columnsToShow.filter(col => col !== 'actions');
  }, [visibleColumns, columns]);

  // Render cell function
  const renderCell = useCallback(
    (reconciliation: APIStockReconciliation, columnKey: string) => {
      const metrics = calculateMetrics(reconciliation);
      switch (columnKey) {
        case 'title':
          return (
            <div>
              <div className="font-medium">{reconciliation.title}</div>
              {reconciliation.description && (
                <div className="max-w-xs truncate text-sm text-gray-500">
                  {reconciliation.description}
                </div>
              )}
            </div>
          );
        case 'status':
          return getStatusBadge(reconciliation.status);
        case 'itemCount':
          return (
            <div>
              <span className="font-mono">{reconciliation.items.length}</span>
            </div>
          );
        case 'netDiscrepancy':
          return (
            <span
              className={`font-mono ${metrics.netUnits > 0 ? 'text-green-700' : metrics.netUnits < 0 ? 'text-red-700' : 'text-muted-foreground'}`}
            >
              {formatSignedUnits(metrics.netUnits)}
            </span>
          );
        case 'overageDiscrepancy':
          return (
            <span className="font-mono text-green-700">
              {formatSignedUnits(metrics.overageUnits)}
            </span>
          );
        case 'shortageDiscrepancy':
          return (
            <span className="font-mono text-red-700">
              {formatSignedUnits(-metrics.shortageUnits)}
            </span>
          );
        case 'createdBy':
          return (
            <div className="text-sm">
              <div>{`${reconciliation.createdBy.firstName} ${reconciliation.createdBy.lastName}`}</div>
              <div className="text-gray-500">
                {reconciliation.createdBy.email}
              </div>
            </div>
          );
        case 'createdAt':
          return new Date(reconciliation.createdAt).toLocaleDateString();
        case 'updatedAt':
          return reconciliation.updatedAt ? (
            <span className="text-sm">
              {new Date(reconciliation.updatedAt).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-gray-400 italic">-</span>
          );
        default:
          return null;
      }
    },
    [getStatusBadge, calculateMetrics]
  );

  // Render actions
  const renderActions = useCallback(
    (reconciliation: APIStockReconciliation) => {
      if (!canManageReconciliations) return null;

      const isOwner = reconciliation.createdBy.id.toString() === user.id;
      const isAdmin = user.role === 'ADMIN';
      const canEdit = reconciliation.status === 'DRAFT' && (isOwner || isAdmin);
      const canSubmit =
        reconciliation.status === 'DRAFT' && (isOwner || isAdmin);
      const canApprove = reconciliation.status === 'PENDING' && isAdmin;
      const canDelete =
        reconciliation.status === 'DRAFT' && (isOwner || isAdmin);

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <IconDots className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href={`/inventory/stock-reconciliations/${reconciliation.id}`}
              >
                <IconEye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>

            {canEdit && (
              <DropdownMenuItem asChild>
                <Link
                  href={`/inventory/stock-reconciliations/${reconciliation.id}/edit`}
                >
                  <IconEdit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
            )}

            {canSubmit && (
              <DropdownMenuItem
                onClick={() => handleSubmitForApproval(reconciliation.id)}
              >
                <IconSend className="mr-2 h-4 w-4" />
                Submit for Approval
              </DropdownMenuItem>
            )}

            {canApprove && (
              <>
                <DropdownMenuItem
                  className="text-green-600"
                  onClick={() => handleApprove(reconciliation.id)}
                >
                  <IconCheck className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => handleReject(reconciliation)}
                >
                  <IconX className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
              </>
            )}

            {canDelete && (
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  setReconciliationToDelete(reconciliation);
                  setDeleteDialogOpen(true);
                }}
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    [
      canManageReconciliations,
      user.id,
      user.role,
      handleSubmitForApproval,
      handleApprove,
      handleReject,
    ]
  );

  return (
    <>
      <InventoryPageLayout
        // Header
        title="Stock Reconciliations"
        description="Compare physical stock counts with system records and resolve discrepancies"
        actions={
          canManageReconciliations ? (
            <Button asChild>
              <Link
                href="/inventory/stock-reconciliations/add"
                className="flex items-center gap-2"
              >
                <IconPlus className="h-4 w-4" />
                New Reconciliation
              </Link>
            </Button>
          ) : undefined
        }
        // Filters
        searchPlaceholder="Search reconciliations..."
        searchValue={filters.search}
        onSearchChange={value => handleFilterChange('search', value)}
        isSearching={isSearching}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key: string, value: unknown) =>
          handleFilterChange(key, value as string)
        }
        onResetFilters={handleResetFilters}
        // Table
        tableTitle="Stock Reconciliations"
        totalCount={total}
        currentCount={reconciliations.length}
        columns={columnsWithActions}
        visibleColumns={effectiveVisibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="stock-reconciliations-visible-columns"
        data={reconciliations}
        renderCell={renderCell}
        renderActions={renderActions}
        // Pagination
        pagination={currentPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Loading states
        isLoading={loading}
        isRefetching={reconciliationsQuery.isFetching && !loading}
        error={reconciliationsQuery.error?.message}
        // Empty state
        emptyStateIcon={<IconClipboard className="h-12 w-12 text-gray-400" />}
        emptyStateMessage={
          debouncedSearchTerm || filters.status
            ? 'No stock reconciliations found matching your filters.'
            : 'No stock reconciliations found. Create your first reconciliation to get started.'
        }
        emptyStateAction={
          canManageReconciliations ? (
            <Button asChild>
              <Link href="/inventory/stock-reconciliations/add">
                <IconPlus className="mr-2 h-4 w-4" />
                New Reconciliation
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-red-500" />
              Delete Stock Reconciliation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the reconciliation &quot;
              {reconciliationToDelete?.title}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReconciliation}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconX className="h-5 w-5 text-red-500" />
              Reject Stock Reconciliation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the reconciliation &quot;
              {reconciliationToReject?.title}&quot;? Please provide a reason for
              rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Reason for Rejection</Label>
              <Textarea
                id="reject-reason"
                placeholder="Please provide a detailed reason for rejecting this reconciliation..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setRejectDialogOpen(false);
                setReconciliationToReject(null);
                setRejectReason('');
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default React.memo(StockReconciliationList);
