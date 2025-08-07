'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useSuppliers,
  useDeleteSupplier,
  useUpdateSupplier,
  type Supplier as APISupplier,
} from '@/hooks/api/suppliers';
import { InventoryPageLayout } from '@/components/inventory/InventoryPageLayout';
import SupplierDetailModal from '@/components/inventory/SupplierDetailModal';
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
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconEye,
  IconPhone,
  IconMail,
  IconTruck,
  IconX,
  IconRefresh,
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

interface SupplierListProps {
  user: User;
}

const SupplierList = ({ user }: SupplierListProps) => {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<APISupplier | null>(
    null
  );
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [supplierToReactivate, setSupplierToReactivate] =
    useState<APISupplier | null>(null);

  // Modal state
  const [supplierDetailModalOpen, setSupplierDetailModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null
  );

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Column configuration - only showing actual supplier fields
  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      { key: 'contactPerson', label: 'Contact Person', defaultVisible: true },
      { key: 'email', label: 'Email', defaultVisible: true },
      { key: 'phone', label: 'Phone', defaultVisible: true },
      { key: 'address', label: 'Address', defaultVisible: true },
      { key: 'isActive', label: 'Status', defaultVisible: true },
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
    // Clean up localStorage if it contains "actions"
    const storageKey = 'suppliers-visible-columns';
    const storedColumns = localStorage.getItem(storageKey);
    if (storedColumns) {
      try {
        const parsed = JSON.parse(storedColumns);
        if (Array.isArray(parsed) && parsed.includes('actions')) {
          const cleaned = parsed.filter((col: string) => col !== 'actions');
          localStorage.setItem(storageKey, JSON.stringify(cleaned));
          // Also update the visible columns state
          setVisibleColumns(prev => prev.filter(col => col !== 'actions'));
        }
      } catch (_error) {
        // If parsing fails, remove the item
        localStorage.removeItem(storageKey);
      }
    }
  }, []); // Empty dependency array - run once on mount

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
  const suppliersQuery = useSuppliers({
    search: debouncedSearchTerm,
    status: filters.isActive,
    sortBy: 'name',
    sortOrder: 'asc',
    page: pagination.page,
    limit: pagination.limit,
  });

  const deleteSupplierMutation = useDeleteSupplier();
  const updateSupplierMutation = useUpdateSupplier();

  // Extract data from queries
  const suppliers = suppliersQuery.data?.data || [];
  const loading = suppliersQuery.isLoading;
  const total = suppliersQuery.data?.pagination?.totalSuppliers || 0;
  const apiPagination = suppliersQuery.data?.pagination;

  // Update pagination state from API response
  const currentPagination = {
    page: apiPagination?.page || pagination.page,
    limit: apiPagination?.limit || pagination.limit,
    totalPages:
      apiPagination?.totalPages || Math.ceil(total / pagination.limit),
    totalItems: total,
  };

  // Permission checks
  const canManageSuppliers = ['ADMIN', 'MANAGER'].includes(user.role);
  const canDeleteSuppliers = user.role === 'ADMIN';

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

  // Modal handlers
  const handleViewSupplier = useCallback((supplierId: number) => {
    setSelectedSupplierId(supplierId);
    setSupplierDetailModalOpen(true);
  }, []);

  const handleCloseSupplierModal = useCallback(() => {
    setSupplierDetailModalOpen(false);
    setSelectedSupplierId(null);
  }, []);

  const handleEditSupplier = useCallback(
    (supplierId: number) => {
      // Navigate to edit page
      router.push(`/inventory/suppliers/${supplierId}/edit`);
    },
    [router]
  );

  const handleDeactivateSupplier = useCallback(
    async (supplierId: number) => {
      try {
        await updateSupplierMutation.mutateAsync({
          id: supplierId,
          data: { isActive: false },
        });
        toast.success('Supplier deactivated successfully');
      } catch (error) {
        logger.error('Failed to deactivate supplier', {
          supplierId,
          error: error instanceof Error ? error.message : String(error),
        });
        toast.error('Failed to deactivate supplier');
      }
    },
    [updateSupplierMutation]
  );

  const handleReactivateSupplier = useCallback(
    async (supplierId: number) => {
      try {
        await updateSupplierMutation.mutateAsync({
          id: supplierId,
          data: { isActive: true },
        });
        toast.success('Supplier reactivated successfully');
      } catch (error) {
        logger.error('Failed to reactivate supplier', {
          supplierId,
          error: error instanceof Error ? error.message : String(error),
        });
        toast.error('Failed to reactivate supplier');
      }
    },
    [updateSupplierMutation]
  );

  // Handle reactivate supplier from dialog
  const handleReactivateSupplierFromDialog = useCallback(async () => {
    if (!supplierToReactivate) return;

    try {
      await updateSupplierMutation.mutateAsync({
        id: supplierToReactivate.id,
        data: { isActive: true },
      });
      toast.success('Supplier reactivated successfully');
    } catch (error) {
      logger.error('Failed to reactivate supplier', {
        supplierId: supplierToReactivate.id,
        supplierName: supplierToReactivate.name,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to reactivate supplier');
    } finally {
      setReactivateDialogOpen(false);
      setSupplierToReactivate(null);
    }
  }, [supplierToReactivate, updateSupplierMutation]);

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
    (supplier: APISupplier, columnKey: string) => {
      switch (columnKey) {
        case 'name':
          return <span className="font-medium">{supplier.name}</span>;
        case 'contactPerson':
          return (
            supplier.contactPerson || (
              <span className="text-gray-400 italic">No contact</span>
            )
          );
        case 'email':
          return supplier.email ? (
            <div className="flex items-center text-sm">
              <IconMail className="mr-1 h-3 w-3" />
              {supplier.email}
            </div>
          ) : (
            <span className="text-gray-400 italic">No email</span>
          );
        case 'phone':
          return supplier.phone ? (
            <div className="flex items-center text-sm">
              <IconPhone className="mr-1 h-3 w-3" />
              {supplier.phone}
            </div>
          ) : (
            <span className="text-gray-400 italic">No phone</span>
          );
        case 'address':
          return supplier.address ? (
            <div className="max-w-xs truncate" title={supplier.address}>
              {supplier.address}
            </div>
          ) : (
            <span className="text-gray-400 italic">No address</span>
          );
        case 'isActive':
          return getStatusBadge(supplier.isActive);
        case 'createdAt':
          return new Date(supplier.createdAt).toLocaleDateString();
        case 'updatedAt':
          return supplier.updatedAt ? (
            <span className="text-sm">
              {new Date(supplier.updatedAt).toLocaleDateString()}
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
    (supplier: APISupplier) => {
      if (!canManageSuppliers) return null;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <IconDots className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => handleViewSupplier(supplier.id)}>
              <IconEye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleEditSupplier(supplier.id)}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {canDeleteSuppliers && supplier.isActive && (
              <DropdownMenuItem
                className="text-red-600"
                onSelect={() => {
                  setSupplierToDelete(supplier);
                  setDeleteDialogOpen(true);
                }}
              >
                <IconX className="mr-2 h-4 w-4" />
                Deactivate
              </DropdownMenuItem>
            )}
            {canDeleteSuppliers && !supplier.isActive && (
              <DropdownMenuItem
                className="text-green-600"
                onSelect={() => handleReactivateSupplier(supplier.id)}
              >
                <IconRefresh className="mr-2 h-4 w-4" />
                Reactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    [
      canManageSuppliers,
      canDeleteSuppliers,
      handleViewSupplier,
      handleEditSupplier,
      handleReactivateSupplier,
    ]
  );

  return (
    <>
      <InventoryPageLayout
        // Header
        title="Suppliers"
        description="Manage your suppliers and vendor relationships"
        actions={
          canManageSuppliers ? (
            <Button asChild>
              <Link
                href="/inventory/suppliers/add"
                className="flex items-center gap-2"
              >
                <IconPlus className="h-4 w-4" />
                Add Supplier
              </Link>
            </Button>
          ) : undefined
        }
        // Filters
        searchPlaceholder="Search suppliers..."
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
        tableTitle="Suppliers"
        totalCount={total}
        currentCount={suppliers.length}
        columns={columnsWithActions}
        visibleColumns={effectiveVisibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="suppliers-visible-columns"
        data={suppliers}
        renderCell={renderCell}
        renderActions={renderActions}
        // Pagination
        pagination={currentPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Loading states
        isLoading={loading}
        isRefetching={suppliersQuery.isFetching && !loading}
        error={suppliersQuery.error?.message}
        // Empty state
        emptyStateIcon={<IconTruck className="h-12 w-12 text-gray-400" />}
        emptyStateMessage={
          debouncedSearchTerm || filters.isActive
            ? 'No suppliers found matching your filters.'
            : 'No suppliers found. Add your first supplier to get started.'
        }
        emptyStateAction={
          canManageSuppliers ? (
            <Button asChild>
              <Link href="/inventory/suppliers/add">
                <IconPlus className="mr-2 h-4 w-4" />
                Add Supplier
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-red-500" />
              Deactivate Supplier
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{supplierToDelete?.name}
              &quot;? This will mark the supplier as inactive and they
              won&apos;t appear in active supplier lists, but their data will be
              preserved for historical records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (supplierToDelete) {
                  try {
                    await deleteSupplierMutation.mutateAsync(
                      supplierToDelete.id
                    );
                    toast.success('Supplier deactivated successfully');
                  } catch (error) {
                    logger.error('Failed to deactivate supplier', {
                      supplierId: supplierToDelete.id,
                      supplierName: supplierToDelete.name,
                      error:
                        error instanceof Error ? error.message : String(error),
                    });
                    toast.error('Failed to deactivate supplier');
                  } finally {
                    setDeleteDialogOpen(false);
                    setSupplierToDelete(null);
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Confirmation Dialog */}
      <AlertDialog
        open={reactivateDialogOpen}
        onOpenChange={setReactivateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconRefresh className="h-5 w-5 text-green-500" />
              Reactivate Supplier
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate &quot;
              {supplierToReactivate?.name}
              &quot;? This will mark the supplier as active and they will appear
              in active supplier lists again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivateSupplierFromDialog}
              className="bg-green-600 hover:bg-green-700"
            >
              Reactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Supplier Detail Modal */}
      <SupplierDetailModal
        supplierId={selectedSupplierId}
        isOpen={supplierDetailModalOpen}
        onClose={handleCloseSupplierModal}
        onEdit={handleEditSupplier}
        onDeactivate={handleDeactivateSupplier}
        onReactivate={handleReactivateSupplier}
        canEdit={canManageSuppliers}
        canDeactivate={canDeleteSuppliers}
      />
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(SupplierList);
