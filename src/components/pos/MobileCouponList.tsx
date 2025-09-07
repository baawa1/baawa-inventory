'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useCoupons,
  useDeleteCoupon,
  type Coupon as APICoupon,
} from '@/hooks/api/useCoupons';

// Mobile-optimized components
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { MobileDashboardFiltersBar, FilterConfig } from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  IconTicket,
  IconAlertTriangle,
  IconPercentage,
  IconCurrencyNaira,
  IconDots,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconEye,
} from '@tabler/icons-react';

import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { USER_ROLES } from '@/lib/auth/roles';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface MobileCouponListProps {
  user: User;
}

export function MobileCouponList({ user }: MobileCouponListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<APICoupon | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 500);
  const isSearching = filters.search !== debouncedSearchTerm;

  // API hooks
  const couponsQuery = useCoupons({
    search: debouncedSearchTerm,
    status: filters.status || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const deleteCouponMutation = useDeleteCoupon();

  // Extract data
  const coupons = useMemo(
    () => couponsQuery.data?.data || [],
    [couponsQuery.data?.data]
  );

  // Column configuration with bold headers
  const columns = useMemo(
    () => [
      {
        key: 'code',
        label: 'Coupon Code',
        sortable: true,
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'description',
        label: 'Description',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'type',
        label: 'Type',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'value',
        label: 'Value',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'minimumAmount',
        label: 'Min Amount',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'usageLimit',
        label: 'Usage Limit',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'timesUsed',
        label: 'Times Used',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'validFrom',
        label: 'Valid From',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'validTo',
        label: 'Valid To',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'isActive',
        label: 'Status',
        defaultVisible: true,
        className: 'font-bold',
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
        key: 'type',
        label: 'Coupon Type',
        type: 'select',
        options: [
          { value: '', label: 'All Types' },
          { value: 'PERCENTAGE', label: 'Percentage' },
          { value: 'FIXED_AMOUNT', label: 'Fixed Amount' },
        ],
        placeholder: 'All Types',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: '', label: 'All Status' },
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

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      type: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
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

  // Handle sort change
  const handleSortChange = useCallback((value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    }));
  }, []);

  // Sort options
  const sortOptions = useMemo(
    () => [
      { value: 'createdAt-desc', label: 'Newest First' },
      { value: 'createdAt-asc', label: 'Oldest First' },
      { value: 'name-asc', label: 'Name (A-Z)' },
      { value: 'name-desc', label: 'Name (Z-A)' },
      { value: 'code-asc', label: 'Code (A-Z)' },
      { value: 'code-desc', label: 'Code (Z-A)' },
      { value: 'validTo-asc', label: 'Expiring Soon' },
      { value: 'validTo-desc', label: 'Expiring Later' },
    ],
    []
  );

  // Handle delete coupon
  const handleDeleteCoupon = useCallback(() => {
    if (!couponToDelete) return;

    deleteCouponMutation.mutate(couponToDelete.id, {
      onSuccess: () => {
        toast.success(`Coupon "${couponToDelete.name}" has been deleted`);
        couponsQuery.refetch();
        setDeleteDialogOpen(false);
        setCouponToDelete(null);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete coupon');
      },
    });
  }, [couponToDelete, deleteCouponMutation, couponsQuery]);

  // Get coupon type badge
  const getCouponTypeBadge = useCallback((type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return (
          <Badge className="bg-blue-100 text-blue-700 text-xs">
            <IconPercentage className="h-3 w-3 mr-1" />
            Percentage
          </Badge>
        );
      case 'FIXED_AMOUNT':
        return (
          <Badge className="bg-green-100 text-green-700 text-xs">
            <IconCurrencyNaira className="h-3 w-3 mr-1" />
            Fixed Amount
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-xs">{type}</Badge>;
    }
  }, []);

  // Get coupon status badge
  const getCouponStatusBadge = useCallback((coupon: APICoupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validTo = new Date(coupon.updatedAt);

    if (!coupon.isActive) {
      return <Badge variant="secondary" className="text-xs">Inactive</Badge>;
    } else if (now < validFrom) {
      return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Upcoming</Badge>;
    } else if (now > validTo) {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>;
    }
  }, []);

  // Get coupon value display
  const getCouponValue = useCallback((coupon: APICoupon) => {
    if (coupon.type === 'PERCENTAGE') {
      return `${coupon.value}%`;
    } else {
      return formatCurrency(coupon.value);
    }
  }, []);

  // Render cell function
  const renderCell = useCallback(
    (coupon: APICoupon, columnKey: string) => {
      switch (columnKey) {
        case 'code':
          return (
            <span className="font-mono text-xs sm:text-sm font-medium bg-gray-100 px-2 py-1 rounded">
              {coupon.code}
            </span>
          );
        case 'name':
          return (
            <div className="min-w-0">
              <div className="font-medium text-xs sm:text-sm truncate">
                {coupon.name}
              </div>
              {coupon.description && (
                <div className="text-xs text-muted-foreground truncate">
                  {coupon.description}
                </div>
              )}
            </div>
          );
        case 'description':
          return (
            <span className="text-xs sm:text-sm" title={coupon.description || undefined}>
              {coupon.description ? (
                coupon.description.length > 50
                  ? `${coupon.description.slice(0, 50)}...`
                  : coupon.description
              ) : '-'}
            </span>
          );
        case 'type':
          return getCouponTypeBadge(coupon.type);
        case 'value':
          return (
            <span className="font-semibold text-xs sm:text-sm">
              {getCouponValue(coupon)}
            </span>
          );
        case 'minimumAmount':
          return (
            <span className="text-xs sm:text-sm">
              {coupon.minimumAmount ? formatCurrency(coupon.minimumAmount) : '-'}
            </span>
          );
        case 'usageLimit':
          return (
            <span className="text-xs sm:text-sm">
              {'∞'}
            </span>
          );
        case 'timesUsed':
          return (
            <span className="text-xs sm:text-sm font-medium">
              {0}
            </span>
          );
        case 'validFrom':
          return (
            <div>
              <div className="text-xs sm:text-sm">
                {format(new Date(coupon.validFrom), 'MMM dd, yyyy')}
              </div>
            </div>
          );
        case 'validTo':
          return (
            <div>
              <div className="text-xs sm:text-sm">
                {format(new Date(coupon.updatedAt), 'MMM dd, yyyy')}
              </div>
            </div>
          );
        case 'isActive':
          return getCouponStatusBadge(coupon);
        default:
          return <span className="text-xs sm:text-sm">-</span>;
      }
    },
    [getCouponTypeBadge, getCouponStatusBadge, getCouponValue]
  );

  // Check permissions
  const canManageCoupons = user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.MANAGER;

  // Render actions function
  const renderActions = useCallback(
    (coupon: APICoupon) => (
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
              href={`/pos/coupons/${coupon.id}`}
              className="flex items-center gap-2"
            >
              <IconEye className="h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          {canManageCoupons && (
            <>
              <DropdownMenuItem asChild>
                <Link
                  href={`/pos/coupons/${coupon.id}/edit`}
                  className="flex items-center gap-2"
                >
                  <IconEdit className="h-4 w-4" />
                  Edit Coupon
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setCouponToDelete(coupon);
                  setDeleteDialogOpen(true);
                }}
                className="flex items-center gap-2 text-red-600"
              >
                <IconTrash className="h-4 w-4" />
                Delete Coupon
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    [canManageCoupons]
  );

  // Mobile card title and subtitle
  const mobileCardTitle = (coupon: APICoupon) => (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
        <IconTicket className="h-5 w-5 text-purple-600" />
      </div>
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">
        {coupon.name}
      </span>
    </div>
  );

  const mobileCardSubtitle = (coupon: APICoupon) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{coupon.code}</span>
      <span>•</span>
      <span className="font-semibold">{getCouponValue(coupon)}</span>
      <span>•</span>
      <IconCalendar className="h-3 w-3" />
      <span>Expires {format(new Date(coupon.updatedAt), 'MMM dd, yyyy')}</span>
      <span>•</span>
      <span>{0}/{'∞'} used</span>
    </div>
  );

  // Current pagination from API response
  const currentPagination = {
    page: couponsQuery.data?.pagination?.page || pagination.page,
    limit: couponsQuery.data?.pagination?.limit || pagination.limit,
    totalPages: couponsQuery.data?.pagination?.totalPages || pagination.totalPages,
    totalItems: couponsQuery.data?.pagination?.total || 0,
  };

  return (
    <>
      <DashboardPageLayout
        title="Coupons"
        description="Manage discount coupons and promotional codes"
        actions={
          canManageCoupons ? (
            <Button asChild>
              <Link href="/pos/coupons/add" className="flex items-center gap-2">
                <IconPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Coupon</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
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
            filterValues={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            sortOptions={sortOptions}
            currentSort={`${filters.sortBy}-${filters.sortOrder}`}
            onSortChange={handleSortChange}
          />

          {/* Mobile-optimized Table */}
          <MobileDashboardTable
            tableTitle="Coupons"
            totalCount={currentPagination.totalItems}
            currentCount={coupons.length}
            columns={columns}
            visibleColumns={visibleColumns}
            onColumnsChange={setVisibleColumns}
            columnCustomizerKey="coupons-visible-columns"
            data={coupons}
            renderCell={renderCell}
            renderActions={renderActions}
            pagination={currentPagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={couponsQuery.isLoading}
            isRefetching={couponsQuery.isFetching && !couponsQuery.isLoading}
            error={couponsQuery.error?.message}
            onRetry={() => couponsQuery.refetch()}
            emptyStateIcon={
              <IconTicket className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            }
            emptyStateMessage="No coupons found"
            emptyStateAction={
              canManageCoupons ? (
                <Button asChild>
                  <Link href="/pos/coupons/add">
                    <IconPlus className="mr-2 h-4 w-4" />
                    Create First Coupon
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
              <IconAlertTriangle className="h-5 w-5" />
              Delete Coupon
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{couponToDelete?.name}"? 
              This action cannot be undone and will affect any pending orders using this coupon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCoupon}
              disabled={deleteCouponMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCouponMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}