"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { useBrands, useDeleteBrand } from "@/hooks/api/brands";
import { InventoryPageLayout } from "./InventoryPageLayout";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FilterConfig, ColumnConfig, PaginationState } from "@/types/inventory";

export default function BrandList() {
  const { status } = useSession();
  const router = useRouter();

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

  // Column configuration
  const [visibleColumns, setVisibleColumns] = useState([
    "name",
    "description",
    "productCount",
    "status",
  ]);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = filters.search !== debouncedSearchTerm;

  // Build query filters
  const queryFilters = {
    offset: (pagination.page - 1) * pagination.limit,
    limit: pagination.limit,
    sortBy: "name",
    sortOrder: "asc" as const,
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    ...(filters.isActive !== "" && {
      isActive: filters.isActive === "true",
    }),
  };

  // Fetch brands with TanStack Query (only when authenticated)
  const {
    data: brandsData,
    isLoading,
    error,
    isRefetching,
    refetch,
  } = useBrands(status === "authenticated" ? queryFilters : {});

  // Delete mutation
  const deleteBrandMutation = useDeleteBrand();

  // Extract data
  const brands = brandsData?.data || [];

  // Update pagination when data changes
  useEffect(() => {
    if (brandsData?.pagination) {
      setPagination((prev) => ({
        ...prev,
        totalPages: brandsData.pagination.pages,
        totalItems: brandsData.pagination.total,
      }));
    }
  }, [brandsData]);

  // Column definitions
  const columns: ColumnConfig[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "description", label: "Description" },
    { key: "productCount", label: "Products" },
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
    setFilters((prev) => ({ ...prev, [key]: value }));
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

  const handleDelete = async (id: number) => {
    try {
      await deleteBrandMutation.mutateAsync(id);
      toast.success("Brand deleted successfully");
    } catch (err) {
      console.error("Error deleting brand:", err);
      toast.error("Failed to delete brand");
    }
  };

  // Render cell content
  const renderCell = (brand: any, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return <div className="font-medium">{brand.name}</div>;
      case "description":
        return brand.description || "-";
      case "productCount":
        return brand._count?.products || 0;
      case "status":
        return (
          <Badge variant={brand.isActive ? "default" : "secondary"}>
            {brand.isActive ? "Active" : "Inactive"}
          </Badge>
        );
      default:
        return null;
    }
  };

  // Render action buttons
  const renderActions = (brand: any) => {
    return (
      <div className="flex items-center justify-end gap-2">
        <Link href={`/inventory/brands/${brand.id}/edit`}>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Brand</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{brand.name}"? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(brand.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // Handle loading states
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

  return (
    <InventoryPageLayout
      // Header
      title="Brands"
      description="Manage your product brands and manufacturers"
      actions={
        <Link href="/inventory/brands/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        </Link>
      }
      // Filters
      searchPlaceholder="Search brands..."
      searchValue={filters.search}
      onSearchChange={handleSearchChange}
      isSearching={isSearching}
      filters={filterConfigs}
      filterValues={filters}
      onFilterChange={handleFilterChange}
      onResetFilters={handleResetFilters}
      // Table
      tableTitle="Brands"
      totalCount={pagination.totalItems}
      currentCount={brands.length}
      columns={columns}
      visibleColumns={visibleColumns}
      onColumnsChange={setVisibleColumns}
      columnCustomizerKey="brands-columns"
      data={brands}
      renderCell={renderCell}
      renderActions={renderActions}
      // Pagination
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      // Loading states
      isLoading={isLoading}
      isRefetching={isRefetching}
      error={error?.message}
      onRetry={refetch}
      // Empty state
      emptyStateMessage={
        filters.search || filters.isActive
          ? "No brands found matching your criteria."
          : "No brands found. Add your first brand to get started."
      }
      emptyStateAction={
        !filters.search && !filters.isActive ? (
          <Link href="/inventory/brands/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add First Brand
            </Button>
          </Link>
        ) : undefined
      }
    />
  );
}
