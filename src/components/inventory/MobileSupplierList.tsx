'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

// Hooks
import { useDebounce } from '@/hooks/useDebounce';
import {
  useSuppliers,
  useDeleteSupplier,
  type SupplierApiModel as APISupplier,
} from '@/hooks/api/suppliers';

// Permissions
import { usePermissions } from '@/hooks/usePermissions';

// UI Components
import { Button } from '@/components/ui/button';
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
import {
  MobileDashboardFiltersBar,
  type MobileDashboardFilterConfig,
} from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

// Custom Components
import SupplierDetailModal from '@/components/inventory/SupplierDetailModal';
import { SUPPLIER_COLUMNS } from '@/components/inventory/ColumnCustomizer';

// Icons
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconEye,
  IconPhone,
  IconMail,
  IconTruck,
  IconX,
  IconWorld,
} from '@tabler/icons-react';

// Utils and Types
import { formatDate } from '@/lib/utils';
import { SortOption, PaginationState } from '@/types/inventory';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface MobileSupplierListProps {
  user: User;
}

interface SupplierFilters {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
];

const MobileSupplierList = ({ user: _user }: MobileSupplierListProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<APISupplier | null>(
    null
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null
  );

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    SUPPLIER_COLUMNS.filter(
      column => column.defaultVisible || column.required
    ).map(column => column.key)
  );

  // Get permissions using centralized hook
  const permissions = usePermissions();
  const { canManageSuppliers, canDeleteSuppliers } = permissions;

  const [filters, setFilters] = useState<SupplierFilters>({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 300);
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks
  const suppliersQuery = useSuppliers({
    search: debouncedSearchTerm,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page: pagination.page,
    limit: pagination.limit,
  });

  const deleteSupplierMutation = useDeleteSupplier();

  // Extract data from queries
  const suppliers = useMemo(
    () => suppliersQuery.data?.data || [],
    [suppliersQuery.data?.data]
  );

  // Filter available columns based on permissions
  const availableColumns = useMemo(() => {
    return SUPPLIER_COLUMNS.filter(column => {
      return true; // No special permission filtering needed for suppliers
    });
  }, []);

  const filterConfigs: MobileDashboardFilterConfig[] = useMemo(() => [], []);

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => {
      const filterKey = key as keyof SupplierFilters;
      if (prev[filterKey] === value) return prev;
      return { ...prev, [filterKey]: value };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
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

  // Delete supplier handler
  const handleDeleteSupplier = useCallback(
    async (supplier: APISupplier) => {
      try {
        await deleteSupplierMutation.mutateAsync(supplier.id);
        toast.success(`Supplier "${supplier.name}" deleted successfully`);
        suppliersQuery.refetch();
      } catch (error) {
        // Error is already logged by global mutation handler
        // Just show user-friendly toast message
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete supplier';
        toast.error(errorMessage);
      }
    },
    [deleteSupplierMutation, suppliersQuery]
  );

  const renderCell = (supplier: APISupplier, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="min-w-0">
            <div className="truncate font-medium">{supplier.name}</div>
            {supplier.contactPerson &&
              !visibleColumns.includes('contactPerson') && (
                <div className="text-muted-foreground truncate text-xs sm:text-sm">
                  Contact: {supplier.contactPerson}
                </div>
              )}
          </div>
        );
      case 'contactPerson':
        return supplier.contactPerson ? (
          <span className="text-xs sm:text-sm">{supplier.contactPerson}</span>
        ) : (
          <span className="text-muted-foreground text-xs sm:text-sm">-</span>
        );
      case 'email':
        return supplier.email ? (
          <a
            href={`mailto:${supplier.email}`}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline sm:text-sm"
          >
            <IconMail className="h-3 w-3" />
            <span className="truncate">{supplier.email}</span>
          </a>
        ) : (
          <span className="text-muted-foreground text-xs sm:text-sm">-</span>
        );
      case 'phone':
        return supplier.phone ? (
          <a
            href={`tel:${supplier.phone}`}
            className="flex items-center gap-1 text-xs hover:underline sm:text-sm"
          >
            <IconPhone className="h-3 w-3" />
            <span>{supplier.phone}</span>
          </a>
        ) : (
          <span className="text-muted-foreground text-xs sm:text-sm">-</span>
        );
      case 'address':
        return supplier.address ? (
          <div className="text-xs sm:text-sm">
            <div className="truncate">
              {supplier.address.length > 30
                ? `${supplier.address.substring(0, 30)}...`
                : supplier.address}
            </div>
            {(supplier.city || supplier.state) && (
              <div className="text-muted-foreground">
                {[supplier.city, supplier.state].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs sm:text-sm">-</span>
        );
      case 'city':
        return (
          <span className="text-xs sm:text-sm">{supplier.city || '-'}</span>
        );
      case 'state':
        return (
          <span className="text-xs sm:text-sm">{supplier.state || '-'}</span>
        );
      case 'website':
        return supplier.website ? (
          <a
            href={supplier.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline sm:text-sm"
          >
            <IconWorld className="h-3 w-3" />
            Website
          </a>
        ) : (
          <span className="text-xs sm:text-sm">-</span>
        );
      case 'createdAt':
        return (
          <span className="text-xs sm:text-sm">
            {supplier.createdAt ? formatDate(supplier.createdAt) : '-'}
          </span>
        );
      case 'updatedAt':
        return (
          <span className="text-xs sm:text-sm">
            {supplier.updatedAt ? formatDate(supplier.updatedAt) : '-'}
          </span>
        );
      case 'notes':
        return supplier.notes ? (
          <span className="text-xs sm:text-sm">
            {supplier.notes.length > 30
              ? `${supplier.notes.substring(0, 30)}...`
              : supplier.notes}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs sm:text-sm">-</span>
        );
      default:
        return <span className="text-xs sm:text-sm">-</span>;
    }
  };

  const renderActions = (supplier: APISupplier) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <IconDots className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            setSelectedSupplierId(supplier.id);
            setDetailModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <IconEye className="h-4 w-4" />
          View Details
        </DropdownMenuItem>
        {canManageSuppliers && (
          <DropdownMenuItem asChild>
            <Link
              href={`/inventory/suppliers/${supplier.id}/edit`}
              className="flex items-center gap-2"
            >
              <IconEdit className="h-4 w-4" />
              Edit Supplier
            </Link>
          </DropdownMenuItem>
        )}
        {canDeleteSuppliers && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => {
              setSupplierToDelete(supplier);
              setDeleteDialogOpen(true);
            }}
          >
            <IconX className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Mobile card title and subtitle
  const mobileCardTitle = (supplier: APISupplier) => (
    <div className="flex items-center gap-3">
      {/* Supplier Icon */}
      <div className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-100">
          <IconTruck className="h-5 w-5 text-orange-600" />
        </div>
      </div>
      {/* Supplier Name */}
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
        {supplier.name}
      </span>
    </div>
  );

  const mobileCardSubtitle = (supplier: APISupplier) => (
    <div className="text-muted-foreground flex items-center gap-2 text-xs">
      <span>{supplier._count?.products || 0} products</span>
      {supplier.contactPerson && (
        <>
          <span>•</span>
          <span className="max-w-[120px] truncate">
            {supplier.contactPerson.length > 15
              ? `${supplier.contactPerson.substring(0, 15)}...`
              : supplier.contactPerson}
          </span>
        </>
      )}
      {supplier.city && (
        <>
          <span>•</span>
          <span>{supplier.city}</span>
        </>
      )}
    </div>
  );

  // Update pagination state when API response changes
  React.useEffect(() => {
    if (suppliersQuery.data?.pagination) {
      const apiPagination = suppliersQuery.data.pagination;
      setPagination(prev => ({
        ...prev,
        totalPages:
          apiPagination.totalPages ||
          Math.ceil((apiPagination.totalSuppliers || 0) / prev.limit),
        totalItems: apiPagination.totalSuppliers || 0,
      }));
    }
  }, [suppliersQuery.data?.pagination]);

  return (
    <>
      <DashboardPageLayout
        title="Suppliers"
        description="Manage suppliers and vendor information"
        actions={
          canManageSuppliers ? (
            <div className="flex flex-row items-center gap-2">
              <Button asChild>
                <Link
                  href="/inventory/suppliers/add"
                  className="flex items-center gap-2"
                >
                  <IconPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Supplier</span>
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
            searchPlaceholder="Search suppliers..."
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
            tableTitle="Suppliers"
            totalCount={pagination.totalItems}
            currentCount={suppliers.length}
            columns={availableColumns}
            visibleColumns={visibleColumns}
            onColumnsChange={setVisibleColumns}
            columnCustomizerKey="suppliers-visible-columns"
            data={suppliers}
            renderCell={renderCell}
            renderActions={renderActions}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={suppliersQuery.isLoading}
            isRefetching={
              suppliersQuery.isFetching && !suppliersQuery.isLoading
            }
            error={suppliersQuery.error?.message}
            onRetry={() => suppliersQuery.refetch()}
            emptyStateIcon={
              <IconTruck className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            }
            emptyStateMessage="No suppliers found"
            emptyStateAction={
              canManageSuppliers ? (
                <Button asChild>
                  <Link href="/inventory/suppliers/add">
                    Add Your First Supplier
                  </Link>
                </Button>
              ) : undefined
            }
            mobileCardTitle={mobileCardTitle}
            mobileCardSubtitle={mobileCardSubtitle}
            keyExtractor={supplier => supplier.id}
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{supplierToDelete?.name}"? This
                action cannot be undone and may affect associated products.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSupplierToDelete(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (supplierToDelete) {
                    handleDeleteSupplier(supplierToDelete);
                  }
                  setDeleteDialogOpen(false);
                  setSupplierToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Supplier Detail Modal */}
        <SupplierDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedSupplierId(null);
          }}
          supplierId={selectedSupplierId}
        />
      </DashboardPageLayout>
    </>
  );
};

export default React.memo(MobileSupplierList);
