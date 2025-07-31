'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';

import { useDebounce } from '@/hooks/useDebounce';
import {
  useCoupons,
  useDeleteCoupon,
  type Coupon as APICoupon,
} from '@/hooks/api/useCoupons';
import { DashboardTableLayout } from '@/components/layouts/DashboardTableLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { USER_ROLES } from '@/lib/auth/roles';

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
  IconTicket,
  IconAlertTriangle,
  IconPercentage,
  IconCurrencyNaira,
} from '@tabler/icons-react';
import type { FilterConfig } from '@/types/inventory';
import type { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';
import { formatCurrency } from '@/lib/utils';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface CouponListProps {
  user: User;
}

export function CouponList({ user }: CouponListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<APICoupon | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Column configuration
  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: 'code',
        label: 'Coupon Code',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      {
        key: 'description',
        label: 'Description',
        defaultVisible: true,
      },
      {
        key: 'type',
        label: 'Type',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'value',
        label: 'Value',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'minimumAmount',
        label: 'Min Amount',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'currentUses',
        label: 'Uses',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'validFrom',
        label: 'Valid From',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'validUntil',
        label: 'Valid Until',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        defaultVisible: true,
      },
      {
        key: 'createdAt',
        label: 'Created',
        sortable: true,
        defaultVisible: false,
      },
      {
        key: 'updatedAt',
        label: 'Updated',
        sortable: true,
        defaultVisible: false,
      },
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
  const couponsQuery = useCoupons({
    search: debouncedSearchTerm,
    status: filters.status,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: pagination.page,
    limit: pagination.limit,
  });

  const deleteCouponMutation = useDeleteCoupon();

  // Extract data from queries
  const coupons = couponsQuery.data?.data || [];
  const loading = couponsQuery.isLoading;
  const total = couponsQuery.data?.pagination?.total || 0;
  const apiPagination = couponsQuery.data?.pagination;

  // Update pagination state from API response
  const currentPagination = {
    page: apiPagination?.page || pagination.page,
    limit: apiPagination?.limit || pagination.limit,
    totalPages:
      apiPagination?.totalPages || Math.ceil(total / pagination.limit),
    totalItems: total,
  };

  // Permission checks
  const canManageCoupons = [USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(
    user.role as any
  );

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'expired', label: 'Expired' },
        ],
        placeholder: 'All Status',
      },
    ],
    []
  );

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => {
      if (prev[key as keyof typeof prev] === value) return prev;
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

  // Handle delete coupon
  const handleDeleteCoupon = useCallback(async () => {
    if (!couponToDelete) return;

    try {
      await deleteCouponMutation.mutateAsync(couponToDelete.id);
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    } catch (_error) {
      // Error is handled by the mutation
    }
  }, [couponToDelete, deleteCouponMutation]);

  // Use columns directly without actions
  const columnsWithActions = useMemo(() => columns, [columns]);

  // Use visible columns directly
  const effectiveVisibleColumns = useMemo(
    () => visibleColumns,
    [visibleColumns]
  );

  // Render cell content
  const renderCell = useCallback((coupon: APICoupon, columnKey: string) => {
    switch (columnKey) {
      case 'code':
        return <span className="font-mono font-medium">{coupon.code}</span>;
      case 'name':
        return coupon.name;
      case 'description':
        return coupon.description || '-';
      case 'type':
        return (
          <Badge variant="outline" className="capitalize">
            {coupon.type.toLowerCase()}
          </Badge>
        );
      case 'value':
        return coupon.type === 'PERCENTAGE' ? (
          <div className="flex items-center gap-1">
            <IconPercentage className="h-3 w-3" />
            <span>{coupon.value}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <IconCurrencyNaira className="h-3 w-3" />
            <span>{coupon.value}</span>
          </div>
        );
      case 'minimumAmount':
        return coupon.minimumAmount
          ? formatCurrency(coupon.minimumAmount)
          : 'No minimum';
      case 'currentUses':
        return `${coupon.currentUses}${coupon.maxUses ? `/${coupon.maxUses}` : ''}`;
      case 'validFrom':
        return new Date(coupon.validFrom).toLocaleDateString();
      case 'validUntil':
        return new Date(coupon.validUntil).toLocaleDateString();
      case 'status':
        const now = new Date();
        const validUntil = new Date(coupon.validUntil);
        const isExpired = validUntil < now;
        const isMaxUsesReached =
          coupon.maxUses && coupon.currentUses >= coupon.maxUses;

        let status = 'active';
        let statusClass = 'bg-green-100 text-green-800';

        if (isExpired) {
          status = 'expired';
          statusClass = 'bg-red-100 text-red-800';
        } else if (isMaxUsesReached) {
          status = 'used up';
          statusClass = 'bg-orange-100 text-orange-800';
        } else if (!coupon.isActive) {
          status = 'inactive';
          statusClass = 'bg-gray-100 text-gray-800';
        }

        return <Badge className={statusClass}>{status.toUpperCase()}</Badge>;
      case 'createdAt':
        return new Date(coupon.createdAt).toLocaleDateString();
      case 'updatedAt':
        return new Date(coupon.updatedAt).toLocaleDateString();
      default:
        return null;
    }
  }, []);

  return (
    <>
      <DashboardTableLayout
        title="Coupons"
        description="Manage discount coupons and promotional codes"
        actions={
          canManageCoupons ? (
            <Button asChild>
              <Link
                href="/pos/coupons/create"
                className="flex items-center gap-2"
              >
                <IconPlus className="h-4 w-4" />
                Create Coupon
              </Link>
            </Button>
          ) : undefined
        }
        // Filters
        searchPlaceholder="Search coupons..."
        searchValue={filters.search}
        onSearchChange={value => handleFilterChange('search', value)}
        isSearching={isSearching}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        // Table
        tableTitle="Coupons"
        totalCount={total}
        currentCount={coupons.length}
        columns={columnsWithActions}
        visibleColumns={effectiveVisibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="coupons-visible-columns"
        data={coupons}
        renderCell={renderCell}
        // Pagination
        pagination={currentPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Loading states
        isLoading={loading}
        isRefetching={couponsQuery.isFetching && !loading}
        error={couponsQuery.error?.message}
        // Empty state
        emptyStateIcon={<IconTicket className="size-12 text-gray-400" />}
        emptyStateMessage={
          debouncedSearchTerm || filters.status
            ? 'No coupons found matching your filters.'
            : 'No coupons found. Get started by creating your first coupon.'
        }
        emptyStateAction={
          canManageCoupons ? (
            <Button asChild>
              <Link href="/pos/coupons/create">
                <IconPlus className="mr-2 h-4 w-4" />
                Create Coupon
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
              Delete Coupon
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the coupon "{couponToDelete?.code}
              "? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCoupon}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCouponMutation.isPending}
            >
              {deleteCouponMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
