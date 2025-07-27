'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useBrands,
  useDeleteBrand,
  type Brand as APIBrand,
} from '@/hooks/api/brands';
import { InventoryPageLayout } from '@/components/inventory/InventoryPageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImagePreview } from '@/components/ui/image-preview';

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
  IconTrash,
  IconBrandX,
  IconAlertTriangle,
} from '@tabler/icons-react';
import type { FilterConfig } from '@/types/inventory';
import type { DashboardTableColumn } from '@/components/layouts/DashboardColumnCustomizer';
import { logger } from '@/lib/logger';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface BrandListProps {
  user: User;
}

export default function BrandList({ user }: BrandListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<APIBrand | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Column configuration - only showing actual brand fields
  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: 'image',
        label: 'Image',
        sortable: false,
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
      { key: 'description', label: 'Description', defaultVisible: true },
      { key: 'website', label: 'Website', defaultVisible: true },
      { key: 'isActive', label: 'Status', defaultVisible: true },
      {
        key: 'productCount',
        label: 'Products',
        defaultVisible: true,
        sortable: true,
      },
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

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
  });

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks for data fetching
  const brandsQuery = useBrands({
    search: debouncedSearchTerm,
    status: filters.isActive,
    sortBy: 'name',
    sortOrder: 'asc',
    page: pagination.page,
    limit: pagination.limit,
  });

  const deleteBrandMutation = useDeleteBrand();

  // Extract data from queries
  const brands = brandsQuery.data?.data || [];
  const loading = brandsQuery.isLoading;
  const total = brandsQuery.data?.pagination?.totalBrands || 0;
  const apiPagination = brandsQuery.data?.pagination;

  // Update pagination state from API response
  const currentPagination = {
    page: apiPagination?.page || pagination.page,
    limit: apiPagination?.limit || pagination.limit,
    totalPages:
      apiPagination?.totalPages || Math.ceil(total / pagination.limit),
    totalItems: total,
  };

  // Permission checks
  const canManageBrands = ['ADMIN', 'MANAGER'].includes(user.role);
  const canDeleteBrands = user.role === 'ADMIN';

  // Filter configurations - memoized to prevent unnecessary re-renders
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

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: any) => {
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
      isActive: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPagination(prev => ({ ...prev, limit: newSize, page: 1 }));
  }, []);

  // Handle delete brand
  const handleDeleteBrand = useCallback(async () => {
    if (!brandToDelete) return;

    // Additional safety check - prevent deletion if brand has products
    if (brandToDelete.productCount > 0) {
      toast.error(
        `Cannot delete brand "${brandToDelete.name}" - it has ${brandToDelete.productCount} associated product${brandToDelete.productCount === 1 ? '' : 's'}`
      );
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
      return;
    }

    try {
      await deleteBrandMutation.mutateAsync(brandToDelete.id);
      toast.success('Brand deleted successfully');
    } catch (error) {
      logger.error('Failed to delete brand', {
        brandId: brandToDelete?.id,
        brandName: brandToDelete?.name,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to delete brand');
    } finally {
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
    }
  }, [brandToDelete, deleteBrandMutation]);

  // Get status badge
  const getStatusBadge = useCallback((isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default">Active</Badge>;
    } else {
      return <Badge variant="secondary">Inactive</Badge>;
    }
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
    (brand: APIBrand, columnKey: string) => {
      switch (columnKey) {
        case 'image':
          return brand.image ? (
            <ImagePreview
              src={brand.image}
              alt={`${brand.name} image`}
              size="md"
              className="rounded-md"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
              <IconBrandX className="h-4 w-4 text-gray-400" />
            </div>
          );
        case 'name':
          return <span className="font-medium">{brand.name}</span>;
        case 'description':
          return (
            brand.description || (
              <span className="text-gray-400 italic">No description</span>
            )
          );
        case 'website':
          return brand.website ? (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              {brand.website}
            </a>
          ) : (
            <span className="text-gray-400 italic">No website</span>
          );
        case 'isActive':
          return getStatusBadge(brand.isActive);
        case 'productCount':
          return (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{brand.productCount || 0}</Badge>
              {brand.productCount > 0 && (
                <span className="text-xs text-gray-500">(cannot delete)</span>
              )}
            </div>
          );
        case 'createdAt':
          return new Date(brand.createdAt).toLocaleDateString();
        case 'updatedAt':
          return brand.updatedAt ? (
            <span className="text-sm">
              {new Date(brand.updatedAt).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-gray-400 italic">-</span>
          );
        default:
          return null;
      }
    },
    [getStatusBadge]
  );

  // Render actions
  const renderActions = useCallback(
    (brand: APIBrand) => {
      if (!canManageBrands) return null;

      const canDelete = brand.productCount === 0;

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
              <Link href={`/inventory/brands/${brand.id}/edit`}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            {canDeleteBrands && (
              <DropdownMenuItem
                className={
                  canDelete
                    ? 'text-red-600'
                    : 'cursor-not-allowed text-gray-400'
                }
                onClick={() => {
                  if (canDelete) {
                    setBrandToDelete(brand);
                    setDeleteDialogOpen(true);
                  }
                }}
                disabled={!canDelete}
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete {!canDelete && `(${brand.productCount} products)`}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    [canManageBrands, canDeleteBrands]
  );

  return (
    <>
      <InventoryPageLayout
        // Header
        title="Brands"
        description="Manage product brands and organize your inventory"
        actions={
          canManageBrands ? (
            <Button asChild>
              <Link
                href="/inventory/brands/add"
                className="flex items-center gap-2"
              >
                <IconPlus className="h-4 w-4" />
                Add Brand
              </Link>
            </Button>
          ) : undefined
        }
        // Filters
        searchPlaceholder="Search brands..."
        searchValue={filters.search}
        onSearchChange={value => handleFilterChange('search', value)}
        isSearching={isSearching}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        // Table
        tableTitle="Brands"
        totalCount={total}
        currentCount={brands.length}
        columns={columnsWithActions}
        visibleColumns={effectiveVisibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="brands-visible-columns"
        data={brands}
        renderCell={renderCell}
        renderActions={renderActions}
        // Pagination
        pagination={currentPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Loading states
        isLoading={loading}
        isRefetching={brandsQuery.isFetching && !loading}
        error={brandsQuery.error?.message}
        // Empty state
        emptyStateIcon={<IconBrandX className="size-12 text-gray-400" />}
        emptyStateMessage={
          debouncedSearchTerm || filters.isActive
            ? 'No brands found matching your filters.'
            : 'No brands found. Get started by creating your first brand.'
        }
        emptyStateAction={
          canManageBrands ? (
            <Button asChild>
              <Link href="/inventory/brands/add">
                <IconPlus className="mr-2 h-4 w-4" />
                Add Brand
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
              Delete Brand
            </AlertDialogTitle>
            <AlertDialogDescription>
              {brandToDelete?.productCount === 0 ? (
                <>
                  Are you sure you want to delete the brand "
                  {brandToDelete?.name}"? This action cannot be undone.
                </>
              ) : (
                <>
                  Cannot delete the brand "{brandToDelete?.name}" because it has{' '}
                  {brandToDelete?.productCount} associated product
                  {brandToDelete?.productCount === 1 ? '' : 's'}. Please remove
                  or reassign all products from this brand before deleting it.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBrand}
              className="bg-red-600 hover:bg-red-700"
              disabled={brandToDelete?.productCount !== 0}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
