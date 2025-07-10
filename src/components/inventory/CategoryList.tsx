"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useCategories,
  useDeleteCategory,
  type Category as APICategory,
} from "@/hooks/api/categories";
import { InventoryPageLayout } from "@/components/inventory/InventoryPageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLUMNS } from "@/components/inventory/ColumnCustomizer";
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
  IconTag,
  IconAlertTriangle,
} from "@tabler/icons-react";
import type { ColumnConfig, FilterConfig } from "@/types/inventory";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface CategoryListProps {
  user: User;
}

export default function CategoryList({ user }: CategoryListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<APICategory | null>(
    null
  );

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name",
    "description",
    "isActive",
    "createdAt",
  ]);

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
  const categoriesQuery = useCategories({
    search: debouncedSearchTerm,
    status: filters.isActive,
    sortBy: "name",
    sortOrder: "asc",
  });

  const deleteCategoryMutation = useDeleteCategory();

  // Extract data from queries
  const categories = categoriesQuery.data?.data || [];
  const loading = categoriesQuery.isLoading;
  const total = categoriesQuery.data?.pagination?.totalCategories || 0;

  // Update pagination when data changes
  React.useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      totalItems: total,
      totalPages: Math.ceil(total / prev.limit),
    }));
  }, [total]);

  // Permission checks
  const canManageCategories = ["ADMIN", "MANAGER"].includes(user.role);
  const canDeleteCategories = user.role === "ADMIN";

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
      placeholder: "All Status",
    },
  ];

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const handleResetFilters = () => {
    setFilters({
      search: "",
      isActive: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination((prev) => ({ ...prev, limit: newSize, page: 1 }));
  };

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategoryMutation.mutateAsync(categoryToDelete.id);
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category"
      );
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default">Active</Badge>;
    } else {
      return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  // Column configuration - only showing actual category fields
  const columns: ColumnConfig[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "description", label: "Description" },
    { key: "isActive", label: "Status" },
    { key: "createdAt", label: "Created" },
  ];

  // Add actions column if user has permissions
  if (canManageCategories) {
    columns.push({ key: "actions", label: "Actions" });
  }

  // Render cell function
  const renderCell = (category: APICategory, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return <span className="font-medium">{category.name}</span>;
      case "description":
        return (
          category.description || (
            <span className="text-gray-400 italic">No description</span>
          )
        );
      case "isActive":
        return getStatusBadge(category.isActive);
      case "createdAt":
        return new Date(category.createdAt).toLocaleDateString();
      case "updatedAt":
        return category.updatedAt ? (
          <span className="text-sm">
            {new Date(category.updatedAt).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-gray-400 italic">-</span>
        );
      default:
        return null;
    }
  };

  // Render actions
  const renderActions = (category: APICategory) => {
    if (!canManageCategories) return null;

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
            <Link href={`/inventory/categories/${category.id}/edit`}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          {canDeleteCategories && (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                setCategoryToDelete(category);
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
  };

  return (
    <>
      <InventoryPageLayout
        // Header
        title="Categories"
        description="Manage product categories and organize your inventory"
        actions={
          canManageCategories ? (
            <Button asChild>
              <Link
                href="/inventory/categories/add"
                className="flex items-center gap-2"
              >
                <IconPlus className="h-4 w-4" />
                Add Category
              </Link>
            </Button>
          ) : undefined
        }
        // Filters
        searchPlaceholder="Search categories..."
        searchValue={filters.search}
        onSearchChange={(value) => handleFilterChange("search", value)}
        isSearching={isSearching}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        // Table
        tableTitle="Categories"
        totalCount={total}
        currentCount={categories.length}
        showingText={`Showing ${categories.length} of ${total} categories`}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="categories-visible-columns"
        columnCustomizerColumns={CATEGORY_COLUMNS}
        data={categories}
        renderCell={renderCell}
        renderActions={renderActions}
        // Pagination
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Loading states
        isLoading={loading}
        isRefetching={categoriesQuery.isFetching && !loading}
        error={categoriesQuery.error?.message}
        // Empty state
        emptyStateIcon={<IconTag className="h-12 w-12 text-gray-400" />}
        emptyStateMessage={
          debouncedSearchTerm || filters.isActive
            ? "No categories found matching your filters."
            : "No categories found. Get started by creating your first category."
        }
        emptyStateAction={
          canManageCategories ? (
            <Button asChild>
              <Link href="/inventory/categories/add">
                <IconPlus className="h-4 w-4 mr-2" />
                Add Category
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
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "
              {categoryToDelete?.name}"? This action cannot be undone. Make sure
              no products are using this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
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
