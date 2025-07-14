"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useSuppliers,
  useDeleteSupplier,
  useUpdateSupplier,
} from "@/hooks/api/suppliers";
import { InventoryPageLayout } from "./InventoryPageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SUPPLIER_COLUMNS } from "@/components/inventory/ColumnCustomizer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  IconPlus,
  IconEdit,
  IconEye,
  IconPhone,
  IconMail,
  IconTruck,
  IconX,
  IconRefresh,
} from "@tabler/icons-react";
import { toast } from "sonner";
import SupplierDetailModal from "./SupplierDetailModal";
import { EditSupplierModal } from "./EditSupplierModal";
import { Supplier } from "./supplier/types";
import { FilterConfig, ColumnConfig, PaginationState } from "@/types/inventory";

export default function SupplierList() {
  const { data: session, status } = useSession();

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    isActive: "",
  });

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null
  );

  // Column configuration
  const [visibleColumns, setVisibleColumns] = useState([
    "name",
    "contactPerson",
    "email",
    "phone",
    "address",
    "status",
  ]);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks for data fetching
  const suppliersQuery = useSuppliers({
    search: debouncedSearchTerm,
    status: filters.isActive,
    sortBy: "name",
    sortOrder: "asc",
  });

  const deleteSupplierMutation = useDeleteSupplier();
  const updateSupplierMutation = useUpdateSupplier();

  // Extract data from queries
  const suppliers = suppliersQuery.data?.data || [];
  const loading = suppliersQuery.isLoading;
  const error = suppliersQuery.error?.message || null;

  // Update pagination when data changes
  useEffect(() => {
    if (suppliersQuery.data?.pagination) {
      setPagination((prev) => ({
        ...prev,
        totalPages: suppliersQuery.data.pagination.totalPages,
        totalItems: suppliersQuery.data.pagination.totalSuppliers,
      }));
    }
  }, [suppliersQuery.data]);

  // Permission checks
  const user = session?.user;
  const canManageSuppliers =
    user && ["ADMIN", "MANAGER"].includes(user.role || "");
  const canDeactivateSuppliers = user && user.role === "ADMIN";

  // Column definitions - only showing actual supplier fields
  const columns: ColumnConfig[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "contactPerson", label: "Contact Person" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    { key: "status", label: "Status" },
  ];

  // Filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      key: "isActive",
      label: "Status",
      type: "select",
      options: [
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
      ],
      placeholder: "Filter by status",
    },
  ];

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => {
      if (prev[key as keyof typeof prev] === value) return prev; // Prevent unnecessary updates
      return { ...prev, [key]: value };
    });
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle search change
  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Clear all filters
  const handleResetFilters = () => {
    setFilters({
      search: "",
      isActive: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newLimit: number) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Modal handlers
  const handleViewSupplier = (supplierId: string) => {
    setSelectedSupplierId(parseInt(supplierId));
    setDetailModalOpen(true);
  };

  const handleEditSupplier = (supplierId: string | number) => {
    setSelectedSupplierId(
      typeof supplierId === "string" ? parseInt(supplierId) : supplierId
    );
    setEditModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedSupplierId(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedSupplierId(null);
  };

  const handleSupplierUpdated = () => {
    // Refresh the suppliers data from server
    suppliersQuery.refetch();
    handleCloseEditModal();
  };

  // Handle delete with TanStack Query mutation
  const handleDeactivate = async (supplierId: number) => {
    try {
      await deleteSupplierMutation.mutateAsync(supplierId);
      toast.success("Supplier deleted successfully");
    } catch (err) {
      console.error("Error deleting supplier:", err);
      toast.error("Failed to delete supplier");
    }
  };

  // Handle reactivate with TanStack Query mutation
  const handleReactivate = async (supplierId: number) => {
    try {
      await updateSupplierMutation.mutateAsync({
        id: supplierId,
        data: { isActive: true },
      });
      toast.success("Supplier reactivated successfully");
    } catch (err) {
      console.error("Error reactivating supplier:", err);
      toast.error("Failed to reactivate supplier");
    }
  };

  // Render cell content
  const renderCell = (supplier: Supplier, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return <div className="font-medium">{supplier.name}</div>;
      case "contactPerson":
        return (
          supplier.contactPerson || (
            <span className="text-gray-400 italic">No contact</span>
          )
        );
      case "email":
        return supplier.email ? (
          <div className="flex items-center text-sm">
            <IconMail className="h-3 w-3 mr-1" />
            {supplier.email}
          </div>
        ) : (
          <span className="text-gray-400 italic">No email</span>
        );
      case "phone":
        return supplier.phone ? (
          <div className="flex items-center text-sm">
            <IconPhone className="h-3 w-3 mr-1" />
            {supplier.phone}
          </div>
        ) : (
          <span className="text-gray-400 italic">No phone</span>
        );
      case "address":
        return supplier.address ? (
          <div className="max-w-xs truncate" title={supplier.address}>
            {supplier.address}
          </div>
        ) : (
          <span className="text-gray-400 italic">No address</span>
        );
      case "status":
        return (
          <Badge variant={supplier.isActive ? "default" : "secondary"}>
            {supplier.isActive ? "Active" : "Inactive"}
          </Badge>
        );
      case "createdAt":
        return supplier.createdAt ? (
          <span className="text-sm">
            {new Date(supplier.createdAt).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-gray-400 italic">-</span>
        );
      case "updatedAt":
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
  };

  // Render action buttons
  const renderActions = (supplier: Supplier) => {
    return (
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewSupplier(supplier.id.toString())}
        >
          <IconEye className="h-4 w-4" />
        </Button>
        {canManageSuppliers && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditSupplier(supplier.id.toString())}
          >
            <IconEdit className="h-4 w-4" />
          </Button>
        )}
        {canDeactivateSuppliers && supplier.isActive && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <IconX className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate Supplier</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to deactivate "{supplier.name}"? This
                  will mark the supplier as inactive and they won't appear in
                  active supplier lists, but their data will be preserved for
                  historical records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeactivate(supplier.id)}
                >
                  Deactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {canDeactivateSuppliers && !supplier.isActive && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <IconRefresh className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reactivate Supplier</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reactivate "{supplier.name}"? This
                  will mark the supplier as active and they will appear in
                  active supplier lists again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleReactivate(supplier.id)}
                >
                  Reactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  };

  // Handle loading and authentication states
  if (status === "loading") {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">
                Please log in to access suppliers.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <InventoryPageLayout
        // Header
        title="Suppliers"
        description="Manage your suppliers and vendor relationships"
        actions={
          canManageSuppliers ? (
            <Link href="/inventory/suppliers/add">
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </Link>
          ) : undefined
        }
        // Filters
        searchPlaceholder="Search suppliers..."
        searchValue={filters.search}
        onSearchChange={handleSearchChange}
        isSearching={isSearching}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        // Table
        tableTitle="Suppliers"
        totalCount={pagination.totalItems}
        currentCount={suppliers.length}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="suppliers-columns"
        data={suppliers}
        renderCell={renderCell}
        renderActions={renderActions}
        // Pagination
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Loading states
        isLoading={loading}
        isRefetching={suppliersQuery.isRefetching}
        error={error || undefined}
        onRetry={() => suppliersQuery.refetch()}
        // Empty state
        emptyStateIcon={
          <IconTruck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        }
        emptyStateMessage={
          filters.search || filters.isActive
            ? "No suppliers found matching your criteria."
            : "No suppliers found. Add your first supplier to get started."
        }
        emptyStateAction={
          !filters.search && !filters.isActive && canManageSuppliers ? (
            <Link href="/inventory/suppliers/add">
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                Add First Supplier
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Modals */}
      <SupplierDetailModal
        supplierId={selectedSupplierId}
        isOpen={detailModalOpen}
        onClose={handleCloseDetailModal}
        canEdit={canManageSuppliers}
        canDeactivate={canDeactivateSuppliers}
        onEdit={handleEditSupplier}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
      />
      <EditSupplierModal
        supplier={
          selectedSupplierId
            ? suppliers.find((s) => s.id === selectedSupplierId) || null
            : null
        }
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSupplierUpdated}
      />
    </>
  );
}
