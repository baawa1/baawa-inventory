'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

// Hooks
import { useDebounce } from '@/hooks/useDebounce';
import {
  useBrands,
  useDeleteBrand,
  type Brand as APIBrand,
} from '@/hooks/api/brands';

// Permissions
import { usePermissions } from '@/hooks/usePermissions';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

// Mobile-optimized components
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { MobileDashboardFiltersBar, FilterConfig } from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

// Custom Components
import { BRAND_COLUMNS } from '@/components/inventory/BrandColumnCustomizer';

// Icons
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconBrandX,
  IconAlertTriangle,
  IconEye,
} from '@tabler/icons-react';

// Utils and Types
import { formatDate } from '@/lib/utils';
import { ErrorHandlers } from '@/lib/utils/error-handling';
import { SortOption, PaginationState } from '@/types/inventory';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface MobileBrandListProps {
  user: User;
}

interface BrandFilters {
  search: string;
  isActive: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
];

const MobileBrandList = ({ user }: MobileBrandListProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<APIBrand | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['name', 'isActive', 'products', 'createdAt']);

  // Get permissions using centralized hook
  const permissions = usePermissions();
  const { canManageBrands, canDeleteBrands } = permissions;

  const [filters, setFilters] = useState<BrandFilters>({
    search: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 300);
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks
  const brandsQuery = useBrands(
    {
      search: debouncedSearchTerm,
      status: filters.isActive,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: pagination.page,
      limit: pagination.limit,
    }
  );

  const deleteBrandMutation = useDeleteBrand();

  // Extract data from queries
  const brands = useMemo(
    () => brandsQuery.data?.data || [],
    [brandsQuery.data?.data]
  );

  // Filter available columns based on permissions
  const availableColumns = useMemo(() => {
    return BRAND_COLUMNS.filter(column => {
      return true; // No special permission filtering needed for brands
    });
  }, []);

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'isActive',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
        placeholder: 'All Status',
      },
    ],
    []
  );

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => {
      const filterKey = key as keyof BrandFilters;
      if (prev[filterKey] === value) return prev;
      return { ...prev, [filterKey]: value };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      isActive: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newPageSize,
      page: 1,
    }));
  };

  // Delete brand handler
  const handleDeleteBrand = useCallback(
    async (brand: APIBrand) => {
      try {
        await deleteBrandMutation.mutateAsync(brand.id);
        toast.success(`Brand "${brand.name}" deleted successfully`);
        brandsQuery.refetch();
      } catch (error) {
        ErrorHandlers.api(error, 'Failed to delete brand');
      }
    },
    [deleteBrandMutation, brandsQuery]
  );

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-500">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const renderCell = (brand: APIBrand, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="min-w-0">
            <div className="font-medium truncate">{brand.name}</div>
            {brand.description && (
              <div className="text-xs sm:text-sm text-muted-foreground truncate">
                {brand.description.length > 20 ? `${brand.description.substring(0, 20)}...` : brand.description}
              </div>
            )}
          </div>
        );
      case 'description':
        return <span className="text-xs sm:text-sm">{brand.description ? (brand.description.length > 20 ? `${brand.description.substring(0, 20)}...` : brand.description) : '-'}</span>;
      case 'products':
        return <span className="text-xs sm:text-sm font-medium">{brand.productCount || 0}</span>;
      case 'isActive':
        return getStatusBadge(brand.isActive);
      case 'wordpress_id':
        return <span className="text-xs sm:text-sm font-mono">{brand.wordpress_id || '-'}</span>;
      case 'createdAt':
        return <span className="text-xs sm:text-sm">{formatDate(brand.createdAt)}</span>;
      case 'updatedAt':
        return <span className="text-xs sm:text-sm">{formatDate(brand.updatedAt)}</span>;
      default:
        return <span className="text-xs sm:text-sm">-</span>;
    }
  };

  const renderActions = (brand: APIBrand) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <IconDots className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canManageBrands && (
          <DropdownMenuItem asChild>
            <Link
              href={`/inventory/brands/${brand.id}/edit`}
              className="flex items-center gap-2"
            >
              <IconEdit className="h-4 w-4" />
              Edit Brand
            </Link>
          </DropdownMenuItem>
        )}
        {canDeleteBrands && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => {
              setBrandToDelete(brand);
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

  // Mobile card title and subtitle
  const mobileCardTitle = (brand: APIBrand) => (
    <div className="flex items-center gap-3">
      {/* Brand Icon */}
      <div className="flex-shrink-0">
        <div className="h-10 w-10 bg-purple-100 rounded-md flex items-center justify-center">
          <IconBrandX className="h-5 w-5 text-purple-600" />
        </div>
      </div>
      {/* Brand Name */}
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">
        {brand.name}
      </span>
    </div>
  );

  const mobileCardSubtitle = (brand: APIBrand) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{brand.productCount || 0} products</span>
      {brand.description && (
        <>
          <span>•</span>
          <span className="truncate max-w-[150px]">{brand.description.length > 20 ? `${brand.description.substring(0, 20)}...` : brand.description}</span>
        </>
      )}
    </div>
  );

  // Update pagination state when API response changes
  React.useEffect(() => {
    if (brandsQuery.data?.pagination) {
      const apiPagination = brandsQuery.data.pagination;
      setPagination(prev => ({
        ...prev,
        totalPages: apiPagination.totalPages || Math.ceil((apiPagination.totalBrands || 0) / prev.limit),
        totalItems: apiPagination.totalBrands || 0,
      }));
    }
  }, [brandsQuery.data?.pagination]);

  return (
    <>
      <DashboardPageLayout
        title="Brands"
        description="Manage product brands and organize your inventory"
        actions={
          canManageBrands ? (
            <div className="flex flex-row items-center gap-2">
              <Button asChild>
                <Link
                  href="/inventory/brands/add"
                  className="flex items-center gap-2"
                >
                  <IconPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Brand</span>
                  <span className="sm:hidden">Add</span>
                </Link>
              </Button>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-6">
          {/* Mobile-optimized Filters */}
          <MobileDashboardFiltersBar
            searchPlaceholder="Search brands..."
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
            currentSort={`${filters.sortBy}-${filters.sortOrder}`}
            onSortChange={handleSortChange}
          />

          {/* Mobile-optimized Table */}
          <MobileDashboardTable
            tableTitle="Brands"
            totalCount={pagination.totalItems}
            currentCount={brands.length}
            columns={availableColumns}
            visibleColumns={visibleColumns}
            onColumnsChange={setVisibleColumns}
            columnCustomizerKey="brands-visible-columns"
            data={brands}
            renderCell={renderCell}
            renderActions={renderActions}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={brandsQuery.isLoading}
            isRefetching={brandsQuery.isFetching && !brandsQuery.isLoading}
            error={brandsQuery.error?.message}
            onRetry={() => brandsQuery.refetch()}
            emptyStateIcon={
              <IconBrandX className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            }
            emptyStateMessage="No brands found"
            emptyStateAction={
              canManageBrands ? (
                <Button asChild>
                  <Link href="/inventory/brands/add">Create Your First Brand</Link>
                </Button>
              ) : undefined
            }
            mobileCardTitle={mobileCardTitle}
            mobileCardSubtitle={mobileCardSubtitle}
            keyExtractor={brand => brand.id}
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Brand</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{brandToDelete?.name}"?
                This action cannot be undone and may affect associated products.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setBrandToDelete(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (brandToDelete) {
                    handleDeleteBrand(brandToDelete);
                  }
                  setDeleteDialogOpen(false);
                  setBrandToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardPageLayout>
    </>
  );
};

export default React.memo(MobileBrandList);