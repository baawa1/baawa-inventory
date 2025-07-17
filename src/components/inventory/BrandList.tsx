"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useBrands,
  useDeleteBrand,
  type Brand as APIBrand,
} from "@/hooks/api/brands";
import { InventoryPageLayout } from "@/components/inventory/InventoryPageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconBrandX,
  IconAlertTriangle,
} from "@tabler/icons-react";
import type { FilterConfig } from "@/types/inventory";
import type { DashboardTableColumn } from "@/components/layouts/DashboardColumnCustomizer";

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
        key: "name",
        label: "Name",
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      { key: "description", label: "Description", defaultVisible: true },
      { key: "website", label: "Website", defaultVisible: true },
      { key: "isActive", label: "Status", defaultVisible: true },
      { key: "createdAt", label: "Created", defaultVisible: true },
      { key: "updatedAt", label: "Updated", defaultVisible: false },
    ],
    []
  );

  // Initialize visibleColumns with default values to prevent hydration mismatch
  const defaultVisibleColumns = useMemo(
    () => columns.filter((col) => col.defaultVisible).map((col) => col.key),
    [columns]
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    defaultVisibleColumns
  );

  // Clean up any "actions" column from localStorage and state
  React.useEffect(() => {
    // Remove "actions" from visibleColumns if it exists
    if (visibleColumns.includes("actions")) {
      setVisibleColumns((prev) => prev.filter((col) => col !== "actions"));
    }

    // Clean up localStorage if it contains "actions"
    const storageKey = "brands-visible-columns";
    const storedColumns = localStorage.getItem(storageKey);
    if (storedColumns) {
      try {
        const parsed = JSON.parse(storedColumns);
        if (Array.isArray(parsed) && parsed.includes("actions")) {
          const cleaned = parsed.filter((col: string) => col !== "actions");
          localStorage.setItem(storageKey, JSON.stringify(cleaned));
        }
      } catch (_error) {
        // If parsing fails, remove the item
        localStorage.removeItem(storageKey);
      }
    }
  }, [visibleColumns]);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    isActive: "",
  });

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks for data fetching
  const brandsQuery = useBrands({
    search: debouncedSearchTerm,
    status: filters.isActive,
    sortBy: "name",
    sortOrder: "asc",
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
  const canManageBrands = ["ADMIN", "MANAGER"].includes(user.role);
  const canDeleteBrands = user.role === "ADMIN";

  // Filter configurations - memoized to prevent unnecessary re-renders
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "isActive",
        label: "Status",
        type: "select",
        options: [
          { value: "true", label: "Active" },
          { value: "false", label: "Inactive" },
        ],
        placeholder: "All Status",
      },
    ],
    []
  );

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters((prev) => {
      if (prev[key as keyof typeof prev] === value) return prev; // Prevent unnecessary updates
      return { ...prev, [key]: value };
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Clear all filters
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: "",
      isActive: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPagination((prev) => ({ ...prev, limit: newSize, page: 1 }));
  }, []);

  // Handle delete brand
  const handleDeleteBrand = useCallback(async () => {
    if (!brandToDelete) return;

    try {
      await deleteBrandMutation.mutateAsync(brandToDelete.id);
      toast.success("Brand deleted successfully");
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete brand"
      );
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
        .filter((col) => col.defaultVisible)
        .map((col) => col.key);
    }

    // Filter out any "actions" column since it's handled automatically by the table
    return columnsToShow.filter((col) => col !== "actions");
  }, [visibleColumns, columns]);

  // Render cell function
  const renderCell = useCallback(
    (brand: APIBrand, columnKey: string) => {
      switch (columnKey) {
        case "name":
          return <span className="font-medium">{brand.name}</span>;
        case "description":
          return (
            brand.description || (
              <span className="text-gray-400 italic">No description</span>
            )
          );
        case "website":
          return brand.website ? (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {brand.website}
            </a>
          ) : (
            <span className="text-gray-400 italic">No website</span>
          );
        case "isActive":
          return getStatusBadge(brand.isActive);
        case "createdAt":
          return new Date(brand.createdAt).toLocaleDateString();
        case "updatedAt":
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
        onSearchChange={(value) => handleFilterChange("search", value)}
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
        emptyStateIcon={<IconBrandX className="h-12 w-12 text-gray-400" />}
        emptyStateMessage={
          debouncedSearchTerm || filters.isActive
            ? "No brands found matching your filters."
            : "No brands found. Get started by creating your first brand."
        }
        emptyStateAction={
          canManageBrands ? (
            <Button asChild>
              <Link href="/inventory/brands/add">
                <IconPlus className="h-4 w-4 mr-2" />
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
              Are you sure you want to delete the brand "{brandToDelete?.name}"?
              This action cannot be undone. Make sure no products are using this
              brand.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBrand}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
