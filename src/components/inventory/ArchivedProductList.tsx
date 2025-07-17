"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useArchivedProducts,
  useUnarchiveProduct,
  type Product as APIProduct,
} from "@/hooks/api/products";
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
  IconDots,
  IconEye,
  IconArchiveOff,
  IconArchive,
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

interface ArchivedProductListProps {
  user: User;
}

export function ArchivedProductList({ user }: ArchivedProductListProps) {
  const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false);
  const [productToUnarchive, setProductToUnarchive] =
    useState<APIProduct | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Clean up any "actions" column from localStorage and state
  React.useEffect(() => {
    // Remove "actions" from visibleColumns if it exists
    if (visibleColumns.includes("actions")) {
      setVisibleColumns((prev) => prev.filter((col) => col !== "actions"));
    }

    // Clean up localStorage if it contains "actions"
    const storageKey = "archived-products-visible-columns";
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
    categoryId: "",
    brandId: "",
  });

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks for data fetching
  const archivedProductsQuery = useArchivedProducts(
    {
      search: debouncedSearchTerm,
      categoryId: filters.categoryId,
      brandId: filters.brandId,
      sortBy: "updatedAt",
      sortOrder: "desc",
    },
    {
      page: pagination.page,
      limit: pagination.limit,
    }
  );

  const unarchiveProductMutation = useUnarchiveProduct();

  // Extract data from queries
  const products = archivedProductsQuery.data?.data || [];
  const loading = archivedProductsQuery.isLoading;
  const total = archivedProductsQuery.data?.pagination?.total || 0;
  const apiPagination = archivedProductsQuery.data?.pagination;

  // Update pagination state from API response
  const currentPagination = {
    page: apiPagination?.page || pagination.page,
    limit: apiPagination?.limit || pagination.limit,
    totalPages:
      apiPagination?.totalPages || Math.ceil(total / pagination.limit),
    totalItems: total,
  };

  // Permission checks
  const canManageProducts = ["ADMIN", "MANAGER"].includes(user.role);

  // Filter configurations - memoized to prevent unnecessary re-renders
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "categoryId",
        label: "Category",
        type: "select",
        options: [], // TODO: Add category options
        placeholder: "All Categories",
      },
      {
        key: "brandId",
        label: "Brand",
        type: "select",
        options: [], // TODO: Add brand options
        placeholder: "All Brands",
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
      categoryId: "",
      brandId: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPagination((prev) => ({ ...prev, limit: newSize, page: 1 }));
  }, []);

  // Handle unarchive product
  const handleUnarchiveProduct = useCallback(async () => {
    if (!productToUnarchive) return;

    try {
      await unarchiveProductMutation.mutateAsync(productToUnarchive.id);
      toast.success("Product unarchived successfully");
    } catch (error) {
      console.error("Error unarchiving product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to unarchive product"
      );
    } finally {
      setUnarchiveDialogOpen(false);
      setProductToUnarchive(null);
    }
  }, [productToUnarchive, unarchiveProductMutation]);

  // Get status badge
  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }, []);

  // Column configuration - only showing actual product fields
  const columns: DashboardTableColumn[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        defaultVisible: true,
        required: true,
      },
      { key: "sku", label: "SKU", defaultVisible: true },
      { key: "category", label: "Category", defaultVisible: true },
      { key: "brand", label: "Brand", defaultVisible: true },
      { key: "stock", label: "Stock", defaultVisible: true },
      { key: "price", label: "Price", defaultVisible: true },
      { key: "status", label: "Status", defaultVisible: true },
      { key: "updatedAt", label: "Archived", defaultVisible: true },
    ],
    []
  );

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
    (product: APIProduct, columnKey: string) => {
      switch (columnKey) {
        case "name":
          return <span className="font-medium">{product.name}</span>;
        case "sku":
          return <span className="font-mono text-sm">{product.sku}</span>;
        case "category":
          return (
            product.category?.name || (
              <span className="text-gray-400 italic">No category</span>
            )
          );
        case "brand":
          return (
            product.brand?.name || (
              <span className="text-gray-400 italic">No brand</span>
            )
          );
        case "stock":
          return (
            <span
              className={
                product.stock <= product.minStock
                  ? "text-red-600 font-medium"
                  : ""
              }
            >
              {product.stock}
            </span>
          );
        case "price":
          return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
          }).format(product.price);
        case "status":
          return getStatusBadge(product.status);
        case "updatedAt":
          return product.updatedAt ? (
            <span className="text-sm">
              {new Date(product.updatedAt).toLocaleDateString()}
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
    (product: APIProduct) => {
      if (!canManageProducts) return null;

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
              <Link href={`/inventory/products/${product.id}`}>
                <IconEye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-green-600"
              onClick={() => {
                setProductToUnarchive(product);
                setUnarchiveDialogOpen(true);
              }}
            >
              <IconArchiveOff className="mr-2 h-4 w-4" />
              Unarchive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    [canManageProducts]
  );

  return (
    <>
      <InventoryPageLayout
        // Header
        title="Archived Products"
        description="View and manage archived products in your inventory"
        // Filters
        searchPlaceholder="Search archived products..."
        searchValue={filters.search}
        onSearchChange={(value) => handleFilterChange("search", value)}
        isSearching={isSearching}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        // Table
        tableTitle="Archived Products"
        totalCount={total}
        currentCount={products.length}
        columns={columnsWithActions}
        visibleColumns={effectiveVisibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="archived-products-visible-columns"
        data={products}
        renderCell={renderCell}
        renderActions={renderActions}
        // Pagination
        pagination={currentPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Loading states
        isLoading={loading}
        isRefetching={archivedProductsQuery.isFetching && !loading}
        error={archivedProductsQuery.error?.message}
        // Empty state
        emptyStateIcon={<IconArchive className="h-12 w-12 text-gray-400" />}
        emptyStateMessage={
          debouncedSearchTerm || filters.categoryId || filters.brandId
            ? "No archived products found matching your filters."
            : "No archived products found."
        }
      />

      {/* Unarchive Confirmation Dialog */}
      <AlertDialog
        open={unarchiveDialogOpen}
        onOpenChange={setUnarchiveDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-yellow-500" />
              Unarchive Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unarchive the product "
              {productToUnarchive?.name}"? This will restore it to your active
              inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnarchiveProduct}
              className="bg-green-600 hover:bg-green-700"
            >
              Unarchive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
