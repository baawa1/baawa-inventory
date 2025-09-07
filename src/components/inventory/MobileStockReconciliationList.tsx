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

// Mobile-optimized components
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { MobileDashboardFiltersBar, FilterConfig } from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

// Icons
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
  IconCalendar,
  IconUser,
  IconPackages,
} from '@tabler/icons-react';

import { format } from 'date-fns';
import { logger } from '@/lib/logger';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface MobileStockReconciliationListProps {
  user: User;
}

const MobileStockReconciliationList = ({ user }: MobileStockReconciliationListProps) => {
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

  // Filters
  const [filters, setFilters] = useState<StockReconciliationFilters>({
    search: '',
    status: '',
  });

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 500);
  const isSearching = filters.search !== debouncedSearchTerm;

  // API hooks
  const reconciliationsQuery = useStockReconciliations({
    ...filters,
    search: debouncedSearchTerm,
  });

  const submitMutation = useSubmitStockReconciliation();
  const approveMutation = useApproveStockReconciliation();
  const rejectMutation = useRejectStockReconciliation();
  const deleteMutation = useDeleteStockReconciliation();

  // Extract data
  const reconciliations = useMemo(
    () => reconciliationsQuery.data?.data || [],
    [reconciliationsQuery.data?.data]
  );

  // Column configuration with bold headers
  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Title',
        sortable: true,
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      { 
        key: 'status', 
        label: 'Status', 
        defaultVisible: true, 
        className: 'font-bold'
      },
      { 
        key: 'itemCount', 
        label: 'Items', 
        defaultVisible: true, 
        className: 'font-bold'
      },
      {
        key: 'totalDiscrepancy',
        label: 'Total Discrepancy',
        defaultVisible: true,
        className: 'font-bold',
      },
      { 
        key: 'createdBy', 
        label: 'Created By', 
        defaultVisible: true, 
        className: 'font-bold'
      },
      { 
        key: 'createdAt', 
        label: 'Created', 
        defaultVisible: true, 
        className: 'font-bold'
      },
      { 
        key: 'approvedBy', 
        label: 'Approved By', 
        defaultVisible: false, 
        className: 'font-bold'
      },
      { 
        key: 'approvedAt', 
        label: 'Approved', 
        defaultVisible: false, 
        className: 'font-bold'
      },
    ],
    []
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter(col => col.defaultVisible).map(col => col.key)
  );

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: '', label: 'All Status' },
          { value: 'DRAFT', label: 'Draft' },
          { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
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
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newPageSize,
      page: 1,
    }));
  }, []);

  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary" className="text-xs">Draft</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-700 text-xs">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  }, []);

  // Handle actions
  const handleSubmit = useCallback((reconciliation: APIStockReconciliation) => {
    submitMutation.mutate(reconciliation.id, {
      onSuccess: () => {
        toast.success('Stock reconciliation submitted for approval');
        reconciliationsQuery.refetch();
      },
      onError: (error: any) => {
        logger.error('Failed to submit stock reconciliation', error);
        toast.error(error.message || 'Failed to submit reconciliation');
      },
    });
  }, [submitMutation, reconciliationsQuery]);

  const handleApprove = useCallback((reconciliation: APIStockReconciliation) => {
    approveMutation.mutate({ id: reconciliation.id }, {
      onSuccess: () => {
        toast.success('Stock reconciliation approved');
        reconciliationsQuery.refetch();
      },
      onError: (error: any) => {
        logger.error('Failed to approve stock reconciliation', error);
        toast.error(error.message || 'Failed to approve reconciliation');
      },
    });
  }, [approveMutation, reconciliationsQuery]);

  const handleReject = useCallback(() => {
    if (!reconciliationToReject || !rejectReason.trim()) return;

    rejectMutation.mutate(
      { id: reconciliationToReject.id, reason: rejectReason },
      {
        onSuccess: () => {
          toast.success('Stock reconciliation rejected');
          reconciliationsQuery.refetch();
          setRejectDialogOpen(false);
          setReconciliationToReject(null);
          setRejectReason('');
        },
        onError: (error: any) => {
          logger.error('Failed to reject stock reconciliation', error);
          toast.error(error.message || 'Failed to reject reconciliation');
        },
      }
    );
  }, [reconciliationToReject, rejectReason, rejectMutation, reconciliationsQuery]);

  const handleDelete = useCallback(() => {
    if (!reconciliationToDelete) return;

    deleteMutation.mutate(String(reconciliationToDelete.id), {
      onSuccess: () => {
        toast.success('Stock reconciliation deleted');
        reconciliationsQuery.refetch();
        setDeleteDialogOpen(false);
        setReconciliationToDelete(null);
      },
      onError: (error: any) => {
        logger.error('Failed to delete stock reconciliation', error);
        toast.error(error.message || 'Failed to delete reconciliation');
      },
    });
  }, [reconciliationToDelete, deleteMutation, reconciliationsQuery]);

  // Render cell function
  const renderCell = useCallback(
    (reconciliation: APIStockReconciliation, columnKey: string) => {
      switch (columnKey) {
        case 'title':
          return (
            <div className="min-w-0">
              <div className="font-medium text-xs sm:text-sm truncate">
                {reconciliation.title}
              </div>
              {reconciliation.description && (
                <div className="text-xs text-muted-foreground truncate">
                  {reconciliation.description}
                </div>
              )}
            </div>
          );
        case 'status':
          return getStatusBadge(reconciliation.status);
        case 'itemCount':
          return (
            <span className="text-xs sm:text-sm">
              {reconciliation.items?.length || 0} items
            </span>
          );
        case 'totalDiscrepancy':
          const total = reconciliation.items?.reduce((sum, item) => 
            sum + Math.abs(item.discrepancy || 0), 0) || 0;
          return (
            <span className="text-xs sm:text-sm font-medium">
              {total > 0 ? `±${total}` : '0'}
            </span>
          );
        case 'createdBy':
          return (
            <span className="text-xs sm:text-sm">
              {reconciliation.createdBy?.email || 'Unknown'}
            </span>
          );
        case 'createdAt':
          return (
            <div>
              <div className="text-xs sm:text-sm">
                {format(new Date(reconciliation.createdAt), 'MMM dd, yyyy')}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(reconciliation.createdAt), 'HH:mm')}
              </div>
            </div>
          );
        case 'approvedBy':
          return (
            <span className="text-xs sm:text-sm">
              {reconciliation.approvedBy?.email || '-'}
            </span>
          );
        case 'approvedAt':
          return reconciliation.approvedAt ? (
            <div>
              <div className="text-xs sm:text-sm">
                {format(new Date(reconciliation.approvedAt), 'MMM dd, yyyy')}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(reconciliation.approvedAt), 'HH:mm')}
              </div>
            </div>
          ) : (
            <span className="text-xs sm:text-sm">-</span>
          );
        default:
          return <span className="text-xs sm:text-sm">-</span>;
      }
    },
    [getStatusBadge]
  );

  // Check permissions
  const canEdit = user.role === 'ADMIN' || user.role === 'MANAGER';
  const canApprove = user.role === 'ADMIN';

  // Render actions function
  const renderActions = useCallback(
    (reconciliation: APIStockReconciliation) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <IconDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link
              href={`/inventory/stock-reconciliations/${reconciliation.id}`}
              className="flex items-center gap-2"
            >
              <IconEye className="h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          
          {canEdit && reconciliation.status === 'DRAFT' && (
            <>
              <DropdownMenuItem asChild>
                <Link
                  href={`/inventory/stock-reconciliations/${reconciliation.id}/edit`}
                  className="flex items-center gap-2"
                >
                  <IconEdit className="h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSubmit(reconciliation)}
                disabled={submitMutation.isPending}
                className="flex items-center gap-2"
              >
                <IconSend className="h-4 w-4" />
                Submit for Approval
              </DropdownMenuItem>
            </>
          )}

          {canApprove && reconciliation.status === 'PENDING' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleApprove(reconciliation)}
                disabled={approveMutation.isPending}
                className="flex items-center gap-2 text-green-600"
              >
                <IconCheck className="h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setReconciliationToReject(reconciliation);
                  setRejectDialogOpen(true);
                }}
                className="flex items-center gap-2 text-red-600"
              >
                <IconX className="h-4 w-4" />
                Reject
              </DropdownMenuItem>
            </>
          )}

          {canEdit && reconciliation.status === 'DRAFT' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setReconciliationToDelete(reconciliation);
                  setDeleteDialogOpen(true);
                }}
                className="flex items-center gap-2 text-red-600"
              >
                <IconTrash className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [canEdit, canApprove, handleSubmit, handleApprove, submitMutation.isPending, approveMutation.isPending]
  );

  // Mobile card title and subtitle
  const mobileCardTitle = (reconciliation: APIStockReconciliation) => (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
        <IconClipboard className="h-5 w-5 text-blue-600" />
      </div>
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">
        {reconciliation.title}
      </span>
    </div>
  );

  const mobileCardSubtitle = (reconciliation: APIStockReconciliation) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <IconCalendar className="h-3 w-3" />
      <span>{format(new Date(reconciliation.createdAt), 'MMM dd, yyyy')}</span>
      <span>•</span>
      <IconUser className="h-3 w-3" />
      <span className="truncate">{reconciliation.createdBy?.email}</span>
      <span>•</span>
      <IconPackages className="h-3 w-3" />
      <span>{reconciliation.items?.length || 0} items</span>
    </div>
  );

  // Current pagination from API response
  const currentPagination = {
    page: reconciliationsQuery.data?.pagination?.page || pagination.page,
    limit: reconciliationsQuery.data?.pagination?.limit || pagination.limit,
    totalPages: reconciliationsQuery.data?.pagination?.totalPages || pagination.totalPages,
    totalItems: reconciliationsQuery.data?.pagination?.total || 0,
  };

  return (
    <>
      <DashboardPageLayout
        title="Stock Reconciliations"
        description="Manage stock reconciliations and adjustments"
        actions={
          canEdit ? (
            <Button asChild>
              <Link href="/inventory/stock-reconciliations/add" className="flex items-center gap-2">
                <IconPlus className="h-4 w-4" />
                <span className="hidden sm:inline">New Reconciliation</span>
                <span className="sm:hidden">New</span>
              </Link>
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-6">
          {/* Mobile-optimized Filters */}
          <MobileDashboardFiltersBar
            searchPlaceholder="Search reconciliations..."
            searchValue={filters.search || ''}
            onSearchChange={value => handleFilterChange('search', value)}
            isSearching={isSearching}
            filters={filterConfigs}
            filterValues={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />

          {/* Mobile-optimized Table */}
          <MobileDashboardTable
            tableTitle="Stock Reconciliations"
            totalCount={currentPagination.totalItems}
            currentCount={reconciliations.length}
            columns={columns}
            visibleColumns={visibleColumns}
            onColumnsChange={setVisibleColumns}
            columnCustomizerKey="stock-reconciliations-visible-columns"
            data={reconciliations}
            renderCell={renderCell}
            renderActions={renderActions}
            pagination={currentPagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={reconciliationsQuery.isLoading}
            isRefetching={reconciliationsQuery.isFetching && !reconciliationsQuery.isLoading}
            error={reconciliationsQuery.error?.message}
            onRetry={() => reconciliationsQuery.refetch()}
            emptyStateIcon={
              <IconClipboard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            }
            emptyStateMessage="No stock reconciliations found"
            emptyStateAction={
              canEdit ? (
                <Button asChild>
                  <Link href="/inventory/stock-reconciliations/add">
                    <IconPlus className="mr-2 h-4 w-4" />
                    Create First Reconciliation
                  </Link>
                </Button>
              ) : undefined
            }
            mobileCardTitle={mobileCardTitle}
            mobileCardSubtitle={mobileCardSubtitle}
            keyExtractor={reconciliation => reconciliation.id}
          />
        </div>
      </DashboardPageLayout>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconX className="h-5 w-5" />
              Reject Reconciliation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this stock reconciliation:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconTrash className="h-5 w-5" />
              Delete Reconciliation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{reconciliationToDelete?.title}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MobileStockReconciliationList;