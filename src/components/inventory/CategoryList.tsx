"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  IconSearch,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconFilter,
  IconTag,
  IconAlertTriangle,
} from "@tabler/icons-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  image?: string;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CategoryListProps {
  user: User;
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export function CategoryList({ user }: CategoryListProps) {
  const { status } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    isActive: "",
  });

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 500);

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = filters.search !== debouncedSearchTerm;

  // Permission checks
  const canManageCategories = ["ADMIN", "MANAGER"].includes(user.role);
  const canDeleteCategories = user.role === "ADMIN";

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    // Don't fetch if session is still loading or not authenticated
    if (status === "loading" || status === "unauthenticated") {
      return;
    }

    try {
      setLoading(true);
      const offset = (currentPage - 1) * itemsPerPage;

      const queryParams = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        sortBy: "name",
        sortOrder: "asc",
      });

      if (debouncedSearchTerm) {
        queryParams.append("search", debouncedSearchTerm);
      }

      if (filters.isActive) {
        queryParams.append("isActive", filters.isActive);
      }

      const response = await fetch(`/api/categories?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch categories");
      }

      const data: CategoriesResponse = await response.json();

      setCategories(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch categories"
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    debouncedSearchTerm,
    filters.isActive,
    status,
  ]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" back to empty string for the API
    const apiValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [key]: apiValue }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      isActive: "",
    });
    setCurrentPage(1);
  };

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to delete category");
      }

      toast.success("Category deleted successfully");
      fetchCategories();
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

  // Calculate pagination
  const totalPages = Math.ceil(total / itemsPerPage);
  const showPagination = totalPages > 1;

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
                Please log in to access categories.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Header Section */}
            <PageHeader
              title="Categories"
              description="Manage product categories and organize your inventory"
              action={
                canManageCategories
                  ? {
                      label: "Add Category",
                      href: "/inventory/categories/add",
                      icon: <IconPlus className="h-4 w-4" />,
                    }
                  : undefined
              }
            />

            {/* Filters Section */}
            <div className="px-4 lg:px-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconFilter className="h-5 w-5" />
                    Filters & Search
                  </CardTitle>
                  <CardDescription>
                    Filter and search through your product categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-start gap-4">
                    {/* Search */}
                    <div className="relative">
                      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search categories..."
                        value={filters.search}
                        onChange={(e) =>
                          handleFilterChange("search", e.target.value)
                        }
                        className="pl-9 pr-8"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        </div>
                      )}
                    </div>

                    {/* Status Filter */}
                    <Select
                      value={filters.isActive === "" ? "all" : filters.isActive}
                      onValueChange={(value) =>
                        handleFilterChange("isActive", value)
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Categories Table */}
            <div className="px-4 lg:px-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconTag className="h-5 w-5" />
                    Categories ({total})
                  </CardTitle>
                  <CardDescription>
                    Manage your product categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-500">
                        Loading categories...
                      </div>
                    </div>
                  ) : (categories?.length || 0) === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <IconTag className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No categories found
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {debouncedSearchTerm || filters.isActive
                          ? "Try adjusting your filters to see more results."
                          : "Get started by creating your first category."}
                      </p>
                      {canManageCategories && (
                        <Button asChild>
                          <Link href="/inventory/categories/add">
                            <IconPlus className="h-4 w-4 mr-2" />
                            Add Category
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            {canManageCategories && (
                              <TableHead className="w-[70px]">
                                Actions
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(categories || []).map((category) => (
                            <TableRow key={category.id}>
                              <TableCell className="font-medium">
                                {category.name}
                              </TableCell>
                              <TableCell>
                                {category.description || (
                                  <span className="text-gray-400 italic">
                                    No description
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(category.isActive)}
                              </TableCell>
                              <TableCell>
                                {new Date(
                                  category.createdAt
                                ).toLocaleDateString()}
                              </TableCell>
                              {canManageCategories && (
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                      >
                                        <span className="sr-only">
                                          Open menu
                                        </span>
                                        <IconDots className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem asChild>
                                        <Link
                                          href={`/inventory/categories/${category.id}/edit`}
                                        >
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
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      {showPagination && (
                        <div className="mt-4">
                          <Pagination>
                            <PaginationContent>
                              <PaginationPrevious
                                onClick={() =>
                                  setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                className={
                                  currentPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                              {Array.from({ length: totalPages }, (_, i) => (
                                <PaginationItem key={i + 1}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(i + 1)}
                                    isActive={currentPage === i + 1}
                                    className="cursor-pointer"
                                  >
                                    {i + 1}
                                  </PaginationLink>
                                </PaginationItem>
                              ))}
                              <PaginationNext
                                onClick={() =>
                                  setCurrentPage(
                                    Math.min(totalPages, currentPage + 1)
                                  )
                                }
                                className={
                                  currentPage === totalPages
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

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
