'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';

// Hooks
import {
  useCoupons,
  useDeleteCoupon,
  type Coupon as APICoupon,
} from '@/hooks/api/useCoupons';
import { useTableState, type CouponFilters } from '@/hooks/useTableState';

// Permissions
import { usePermissions } from '@/hooks/usePermissions';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

// Mobile-optimized components
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { MobileDashboardFiltersBar, FilterConfig } from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

// Shared utilities
import { getCouponStatusBadge } from '@/lib/utils/status-badges';
import { TruncatedDescription } from '@/lib/utils/text-utils';
import { MobileCardTitle, CouponIconWrapper, MobileCardSubtitle } from '@/components/ui/mobile-card-templates';
import { TableActionMenu, buildCouponActions } from '@/components/ui/table-actions';

// Column configurations
import { COUPON_COLUMNS } from '@/lib/table-columns/coupon-columns';

// Icons
import {
  IconPlus,
  IconTicket,
  IconAlertTriangle,
  IconPercentage,
  IconCurrencyNaira,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import type { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';
import { formatCurrency } from '@/lib/utils';
import { SortOption } from '@/types/inventory';

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

const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'code-asc', label: 'Code (A-Z)' },
  { value: 'code-desc', label: 'Code (Z-A)' },
  { value: 'validUntil-asc', label: 'Expiring Soon' },
  { value: 'validUntil-desc', label: 'Expiring Last' },
];

export function CouponList({ user }: CouponListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<APICoupon | null>(null);

  // Get permissions using centralized hook
  const permissions = usePermissions();
  const { canManageProducts } = permissions;

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
  } = useTableState<CouponFilters>({
    initialFilters: {
      search: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    initialVisibleColumns: ['code', 'name', 'type', 'value', 'status', 'validUntil'],
  });

  // Column configuration using unified columns
  const columns = COUPON_COLUMNS;

  // Filter available columns based on permissions
  const availableColumns = useMemo(() => {
    return columns.filter(column => {
      return true; // No special permission filtering needed for coupons
    });
  }, [columns]);

  // TanStack Query hooks for data fetching
  const couponsQuery = useCoupons({
    search: apiFilters.search,
    status: apiFilters.status,
    sortBy: apiFilters.sortBy,
    sortOrder: apiFilters.sortOrder,
    page: pagination.page,
    limit: pagination.limit,
  });

  const deleteCouponMutation = useDeleteCoupon();

  // Extract data from queries
  const coupons = useMemo(
    () => couponsQuery.data?.data || [],
    [couponsQuery.data?.data]
  );

  // Update pagination state when API response changes
  React.useEffect(() => {
    if (couponsQuery.data?.pagination) {
      updatePaginationFromAPI(couponsQuery.data.pagination);
    }
  }, [couponsQuery.data?.pagination, updatePaginationFromAPI]);

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

  // Handle delete coupon
  const handleDeleteCoupon = useCallback(async () => {
    if (!couponToDelete) return;

    try {
      await deleteCouponMutation.mutateAsync(couponToDelete.id);
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
      couponsQuery.refetch();
    } catch (_error) {
      // Error is handled by the mutation
    }
  }, [couponToDelete, deleteCouponMutation, couponsQuery]);

  // Calculate coupon status
  const getCouponStatus = useCallback((coupon: APICoupon): string => {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);
    const isExpired = validUntil < now;
    const isMaxUsesReached = coupon.maxUses && coupon.currentUses >= coupon.maxUses;

    if (isExpired) return 'expired';
    if (isMaxUsesReached) return 'used up';
    if (!coupon.isActive) return 'inactive';
    return 'active';
  }, []);

  // Render cell content
  const renderCell = useCallback((coupon: APICoupon, columnKey: string) => {
    switch (columnKey) {
      case 'code':
        return <span className="font-mono font-medium text-xs sm:text-sm">{coupon.code}</span>;
      case 'name':
        return (
          <div className="min-w-0">
            <div className="font-medium truncate text-xs sm:text-sm">{coupon.name}</div>
            {coupon.description && (
              <TruncatedDescription 
                description={coupon.description} 
                maxLength={30}
                className="text-xs text-muted-foreground truncate mt-0.5"
              />
            )}
          </div>
        );
      case 'description':
        return (
          <TruncatedDescription 
            description={coupon.description} 
            maxLength={50}
          />
        );
      case 'type':
        return (
          <Badge variant="outline" className="capitalize text-xs">
            {coupon.type.toLowerCase()}
          </Badge>
        );
      case 'value':
        return coupon.type === 'PERCENTAGE' ? (
          <div className="flex items-center gap-1">
            <IconPercentage className="h-3 w-3" />
            <span className="text-xs sm:text-sm font-medium">{coupon.value}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <IconCurrencyNaira className="h-3 w-3" />
            <span className="text-xs sm:text-sm font-medium">{formatCurrency(coupon.value)}</span>
          </div>
        );
      case 'minimumAmount':
        return (
          <span className="text-xs sm:text-sm">
            {coupon.minimumAmount ? formatCurrency(coupon.minimumAmount) : 'No minimum'}
          </span>
        );
      case 'currentUses':
        return (
          <span className="text-xs sm:text-sm font-medium">
            {coupon.currentUses}{coupon.maxUses ? `/${coupon.maxUses}` : ''}
          </span>
        );
      case 'validFrom':
        return <span className="text-xs sm:text-sm">{new Date(coupon.validFrom).toLocaleDateString()}</span>;
      case 'validUntil':
        return <span className="text-xs sm:text-sm">{new Date(coupon.validUntil).toLocaleDateString()}</span>;
      case 'status':
        return getCouponStatusBadge(getCouponStatus(coupon), 'text-xs');
      case 'createdAt':
        return <span className="text-xs sm:text-sm">{new Date(coupon.createdAt).toLocaleDateString()}</span>;
      case 'updatedAt':
        return <span className="text-xs sm:text-sm">{new Date(coupon.updatedAt).toLocaleDateString()}</span>;
      default:
        return <span className="text-xs sm:text-sm">-</span>;
    }
  }, [getCouponStatus]);

  const renderActions = useCallback((coupon: APICoupon) => {
    const actions = buildCouponActions({
      coupon,
      canEdit: canManageProducts,
      canDelete: canManageProducts,
      onDelete: () => {
        setCouponToDelete(coupon);
        setDeleteDialogOpen(true);
      },
    });

    // Update action icons
    const actionsWithIcons = actions.map(action => ({
      ...action,
      icon: action.key === 'edit' ? <IconEdit className="h-4 w-4" /> : 
            action.key === 'delete' ? <IconTrash className="h-4 w-4" /> : 
            action.icon,
    }));

    return <TableActionMenu actions={actionsWithIcons} />;
  }, [canManageProducts]);

  // Mobile card title and subtitle
  const mobileCardTitle = useCallback((coupon: APICoupon) => (
    <MobileCardTitle
      icon={
        <CouponIconWrapper>
          <IconTicket className="w-5 h-5" />
        </CouponIconWrapper>
      }
      title={coupon.name}
      subtitle={`Code: ${coupon.code}`}
    >
      <div className="flex items-center gap-2 mt-1">
        {getCouponStatusBadge(getCouponStatus(coupon), 'text-xs')}
        <span className="text-xs font-medium text-green-600">
          {coupon.type === 'PERCENTAGE' 
            ? `${coupon.value}% off`
            : `${formatCurrency(coupon.value)} off`
          }
        </span>
      </div>
    </MobileCardTitle>
  ), [getCouponStatus]);

  const mobileCardSubtitle = useCallback((coupon: APICoupon) => {
    const items = [
      {
        label: 'Uses',
        value: `${coupon.currentUses}${coupon.maxUses ? `/${coupon.maxUses}` : ''}`,
      },
      {
        label: 'Expires',
        value: new Date(coupon.validUntil).toLocaleDateString(),
      },
    ];

    if (coupon.minimumAmount) {
      items.push({
        label: 'Min amount',
        value: formatCurrency(coupon.minimumAmount),
      });
    }

    return (
      <MobileCardSubtitle items={items} />
    );
  }, []);

  return (
    <>
      <DashboardPageLayout
        title="Coupons"
        description="Manage discount coupons and promotional codes"
        actions={
          canManageProducts ? (
            <div className="flex flex-row items-center gap-2">
              <Button asChild>
                <Link
                  href="/pos/coupons/create"
                  className="flex items-center gap-2"
                >
                  <IconPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Coupon</span>
                  <span className="sm:hidden">Create</span>
                </Link>
              </Button>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-6">
          {/* Mobile-optimized Filters */}
          <MobileDashboardFiltersBar
            searchPlaceholder="Search coupons..."
            searchValue={filters.search}
            onSearchChange={value => handleFilterChange('search', value)}
            isSearching={isSearching}
            filters={filterConfigs}
            filterValues={filters as unknown as Record<string, unknown>}
            onFilterChange={(key: string, value: unknown) =>
              handleFilterChange(key, value as string | boolean)
            }
            onResetFilters={handleResetFilters}
            sortOptions={SORT_OPTIONS}
            currentSort={currentSort}
            onSortChange={handleSortChange}
          />

          {/* Mobile-optimized Table */}
          <MobileDashboardTable
            tableTitle="Coupons"
            totalCount={pagination.totalItems}
            currentCount={coupons.length}
            columns={availableColumns}
            visibleColumns={visibleColumns}
            onColumnsChange={setVisibleColumns}
            columnCustomizerKey="coupons-visible-columns"
            data={coupons}
            renderCell={renderCell}
            renderActions={renderActions}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={couponsQuery.isLoading}
            isRefetching={couponsQuery.isFetching && !couponsQuery.isLoading}
            error={couponsQuery.error?.message}
            onRetry={() => couponsQuery.refetch()}
            emptyStateIcon={
              <IconTicket className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            }
            emptyStateMessage={
              apiFilters.search || filters.status
                ? 'No coupons found matching your filters.'
                : 'No coupons found. Get started by creating your first coupon.'
            }
            emptyStateAction={
              canManageProducts ? (
                <Button asChild>
                  <Link href="/pos/coupons/create">
                    Create Your First Coupon
                  </Link>
                </Button>
              ) : undefined
            }
            mobileCardTitle={mobileCardTitle}
            mobileCardSubtitle={mobileCardSubtitle}
            keyExtractor={coupon => coupon.id}
          />
        </div>
      </DashboardPageLayout>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-red-500" />
              Delete Coupon
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the coupon &quot;
              {couponToDelete?.code}
              &quot;? This action cannot be undone.
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
