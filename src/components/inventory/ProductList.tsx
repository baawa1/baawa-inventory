"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { useProducts, type Product as APIProduct } from "@/hooks/api/products";
import { useBrands } from "@/hooks/api/brands";
import { useCategories } from "@/hooks/api/categories";
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ColumnCustomizer,
  PRODUCT_COLUMNS,
} from "@/components/inventory/ColumnCustomizer";
import { AddStockDialog } from "@/components/inventory/AddStockDialog";
import { StockReconciliationDialog } from "@/components/inventory/StockReconciliationDialog";
import {
  IconSearch,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconFilter,
  IconAdjustments,
  IconPackages,
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  image?: string;
}

interface ProductListProps {
  user: User;
}

interface Brand {
  id: number;
  name: string;
  description: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductFilters {
  search: string;
  category: string;
  brand: string;
  status: string;
  supplier: string;
  lowStock: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface PaginationState {
  page: number;
  limit: number;
  totalPages: number;
  totalProducts: number;
}

export function ProductList({ user }: ProductListProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalProducts: 0,
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    category: "",
    brand: "",
    status: "",
    supplier: "",
    lowStock: false,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  // Add Stock Dialog state
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] =
    useState<APIProduct | null>(null);

  // Stock Reconciliation Dialog state
  const [reconciliationDialogOpen, setReconciliationDialogOpen] =
    useState(false);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(filters.search, 300); // Reduced from 500ms to 300ms

  // Show search loading when user is typing but search hasn't been triggered yet
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks for data fetching
  const productsQuery = useProducts({
    search: debouncedSearchTerm,
    category: filters.category,
    brand: filters.brand,
    status: filters.status,
    supplier: filters.supplier,
    lowStock: filters.lowStock,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const brandsQuery = useBrands({ isActive: true });
  const categoriesQuery = useCategories({ status: "active" });

  // Extract data from queries
  const products = productsQuery.data?.data || [];
  const loading = productsQuery.isLoading;
  const error = productsQuery.error?.message || null;
  const brands = brandsQuery.data?.data || [];
  const categories = categoriesQuery.data?.data || [];

  const canManageProducts = ["ADMIN", "MANAGER"].includes(user.role);
  const canEditProducts = ["ADMIN", "MANAGER", "STAFF"].includes(user.role);

  const handleFilterChange = (
    key: keyof ProductFilters,
    value: string | boolean
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page when filters change
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      limit: newPageSize,
      page: 1, // Reset to first page when changing page size
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      category: "",
      brand: "",
      status: "",
      supplier: "",
      lowStock: false,
      sortBy: "created_at",
      sortOrder: "desc",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status: APIProduct["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            Active
          </Badge>
        );
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStockStatus = (product: APIProduct) => {
    if (product.stock === 0) {
      return {
        icon: <IconAlertTriangle className="h-4 w-4 text-red-500" />,
        text: "Out of stock",
        color: "text-red-500",
      };
    } else if (product.stock <= product.min_stock) {
      return {
        icon: <IconAlertTriangle className="h-4 w-4 text-yellow-500" />,
        text: "Low stock",
        color: "text-yellow-500",
      };
    }
    return {
      icon: <IconPackages className="h-4 w-4 text-green-500" />,
      text: "In stock",
      color: "text-green-500",
    };
  };

  const renderCellContent = (product: APIProduct, columnKey: string) => {
    switch (columnKey) {
      case "image":
        const isValidUrl = (url: string) => {
          return (
            url.startsWith("/") ||
            url.startsWith("http://") ||
            url.startsWith("https://")
          );
        };

        return (
          <div className="flex items-center justify-center">
            {product.image &&
            product.image.trim() !== "" &&
            isValidUrl(product.image.trim()) ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed bg-gray-50">
                <IconPackages className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
        );
      case "name":
        return (
          <div>
            <div className="font-medium">{product.name}</div>
            {product.brand && (
              <div className="text-sm text-gray-500">{product.brand.name}</div>
            )}
          </div>
        );
      case "sku":
        return <span className="font-mono text-sm">{product.sku}</span>;
      case "category":
        return product.category?.name || "-";
      case "brand":
        return product.brand?.name || "-";
      case "stock":
        const stockStatus = getStockStatus(product);
        return (
          <div className="flex items-center gap-2">
            {stockStatus.icon}
            <span className={stockStatus.color}>{product.stock}</span>
            <span className="text-gray-400">/ {product.min_stock} min</span>
          </div>
        );
      case "price":
        return (
          <div>
            <div className="font-medium">{formatCurrency(product.price)}</div>
          </div>
        );
      case "cost":
        return (
          <span className="text-sm text-gray-500">
            {formatCurrency(product.cost)}
          </span>
        );
      case "status":
        return getStatusBadge(product.status);
      case "supplier":
        return product.supplier?.name || "-";
      case "description":
        return (
          <div className="max-w-xs truncate text-sm">
            {product.description || "-"}
          </div>
        );
      case "barcode":
        return (
          <span className="font-mono text-sm">{product.barcode || "-"}</span>
        );
      case "min_stock":
        return product.min_stock;
      case "max_stock":
        return product.max_stock || "-";
      case "unit":
        return product.unit;
      case "created_at":
        return new Date(product.createdAt).toLocaleDateString();
      case "updated_at":
        return new Date(product.updatedAt).toLocaleDateString();
      default:
        return "-";
    }
  };

  const getColumnLabel = (columnKey: string) => {
    const column = PRODUCT_COLUMNS.find((col) => col.key === columnKey);
    return column?.label || columnKey;
  };

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Header Section */}
            <div className="px-4 lg:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Products
                  </h1>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Manage your product inventory and stock levels
                  </p>
                </div>
                {canManageProducts && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setReconciliationDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <IconAdjustments className="h-4 w-4" />
                      Reconcile Stock
                    </Button>
                    <Button asChild>
                      <Link
                        href="/inventory/products/add"
                        className="flex items-center gap-2"
                      >
                        <IconPlus className="h-4 w-4" />
                        Add Product
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Filters Section */}
            <div className="px-4 lg:px-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconFilter className="h-5 w-5" />
                    Filters & Search
                  </CardTitle>
                  <CardDescription>
                    Filter and search through your product inventory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-start gap-4">
                    {/* Search */}
                    <div className="relative">
                      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search products..."
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

                    {/* Category Filter */}
                    <Select
                      value={filters.category || "all"}
                      onValueChange={(value) =>
                        handleFilterChange(
                          "category",
                          value === "all" ? "" : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Brand Filter */}
                    <Select
                      value={filters.brand || "all"}
                      onValueChange={(value) =>
                        handleFilterChange(
                          "brand",
                          value === "all" ? "" : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brands</SelectItem>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.name}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select
                      value={filters.status || "all"}
                      onValueChange={(value) =>
                        handleFilterChange(
                          "status",
                          value === "all" ? "" : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="discontinued">
                          Discontinued
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Reset Filters Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilters}
                      className="whitespace-nowrap"
                    >
                      Reset Filters
                    </Button>

                    {/* Sort Options */}
                    <div className="flex items-center justify-center ml-auto">
                      <Select
                        value={`${filters.sortBy}-${filters.sortOrder}`}
                        onValueChange={(value) => {
                          const [sortBy, sortOrder] = value.split("-");
                          handleFilterChange("sortBy", sortBy);
                          handleFilterChange(
                            "sortOrder",
                            sortOrder as "asc" | "desc"
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                          <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                          <SelectItem value="created_at-desc">
                            Newest First
                          </SelectItem>
                          <SelectItem value="created_at-asc">
                            Oldest First
                          </SelectItem>
                          <SelectItem value="stock-asc">
                            Stock (Low to High)
                          </SelectItem>
                          <SelectItem value="stock-desc">
                            Stock (High to Low)
                          </SelectItem>
                          <SelectItem value="price-asc">
                            Price (Low to High)
                          </SelectItem>
                          <SelectItem value="price-desc">
                            Price (High to Low)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Quick Filters */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant={filters.lowStock ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        handleFilterChange("lowStock", !filters.lowStock)
                      }
                    >
                      <IconAlertTriangle className="h-4 w-4 mr-1" />
                      Low Stock Only
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Products Table */}
            <div className="px-4 lg:px-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        Products ({pagination.totalProducts})
                      </CardTitle>
                      <CardDescription>
                        Showing {products.length} of {pagination.totalProducts}{" "}
                        products
                      </CardDescription>
                    </div>
                    <ColumnCustomizer
                      onColumnsChange={setVisibleColumns}
                      localStorageKey="products-visible-columns"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center space-x-4 animate-pulse"
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-500">{error}</p>
                      <Button
                        onClick={() => productsQuery.refetch()}
                        className="mt-4"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-8">
                      <IconPackages className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No products found</p>
                      {canManageProducts && (
                        <Button asChild className="mt-4">
                          <a href="/inventory/products/new">
                            Add Your First Product
                          </a>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {visibleColumns.map((columnKey) => (
                              <TableHead key={columnKey}>
                                {getColumnLabel(columnKey)}
                              </TableHead>
                            ))}
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product) => (
                            <TableRow key={product.id}>
                              {visibleColumns.map((columnKey) => (
                                <TableCell key={columnKey}>
                                  {renderCellContent(product, columnKey)}
                                </TableCell>
                              ))}
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                    >
                                      <IconDots className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                      <a
                                        href={`/inventory/products/${product.id}`}
                                        className="flex items-center gap-2"
                                      >
                                        <IconEye className="h-4 w-4" />
                                        View Details
                                      </a>
                                    </DropdownMenuItem>
                                    {canEditProducts && (
                                      <>
                                        <DropdownMenuItem asChild>
                                          <Link
                                            href={`/inventory/products/${product.id}/edit`}
                                            className="flex items-center gap-2"
                                          >
                                            <IconEdit className="h-4 w-4" />
                                            Edit Product
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedProductForStock(product);
                                            setAddStockDialogOpen(true);
                                          }}
                                          className="flex items-center gap-2"
                                        >
                                          <IconPackages className="h-4 w-4" />
                                          Add Stock
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {canManageProducts && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600">
                                          <IconTrash className="h-4 w-4 mr-2" />
                                          Archive Product
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-500">
                              Showing{" "}
                              {(pagination.page - 1) * pagination.limit + 1} to{" "}
                              {Math.min(
                                pagination.page * pagination.limit,
                                pagination.totalProducts
                              )}{" "}
                              of {pagination.totalProducts} products
                            </p>
                          </div>
                          <div className="flex items-center gap-4 ml-auto">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                Show:
                              </span>
                              <Select
                                value={pagination.limit.toString()}
                                onValueChange={(value) =>
                                  handlePageSizeChange(parseInt(value))
                                }
                              >
                                <SelectTrigger className="h-8 w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="10">10</SelectItem>
                                  <SelectItem value="20">20</SelectItem>
                                  <SelectItem value="50">50</SelectItem>
                                  <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious
                                    onClick={() =>
                                      handlePageChange(
                                        Math.max(1, pagination.page - 1)
                                      )
                                    }
                                    className={
                                      pagination.page === 1
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                    }
                                  />
                                </PaginationItem>

                                {/* Show first page if current page is more than 2 */}
                                {pagination.page > 2 && (
                                  <>
                                    <PaginationItem>
                                      <PaginationLink
                                        onClick={() => handlePageChange(1)}
                                        className="cursor-pointer"
                                      >
                                        1
                                      </PaginationLink>
                                    </PaginationItem>
                                    {pagination.page > 3 && (
                                      <PaginationItem>
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    )}
                                  </>
                                )}

                                {/* Show previous page if exists */}
                                {pagination.page > 1 && (
                                  <PaginationItem>
                                    <PaginationLink
                                      onClick={() =>
                                        handlePageChange(pagination.page - 1)
                                      }
                                      className="cursor-pointer"
                                    >
                                      {pagination.page - 1}
                                    </PaginationLink>
                                  </PaginationItem>
                                )}

                                {/* Current page */}
                                <PaginationItem>
                                  <PaginationLink
                                    isActive
                                    className="cursor-pointer"
                                  >
                                    {pagination.page}
                                  </PaginationLink>
                                </PaginationItem>

                                {/* Show next page if exists */}
                                {pagination.page < pagination.totalPages && (
                                  <PaginationItem>
                                    <PaginationLink
                                      onClick={() =>
                                        handlePageChange(pagination.page + 1)
                                      }
                                      className="cursor-pointer"
                                    >
                                      {pagination.page + 1}
                                    </PaginationLink>
                                  </PaginationItem>
                                )}

                                {/* Show last page if current page is less than totalPages - 1 */}
                                {pagination.page <
                                  pagination.totalPages - 1 && (
                                  <>
                                    {pagination.page <
                                      pagination.totalPages - 2 && (
                                      <PaginationItem>
                                        <PaginationEllipsis />
                                      </PaginationItem>
                                    )}
                                    <PaginationItem>
                                      <PaginationLink
                                        onClick={() =>
                                          handlePageChange(
                                            pagination.totalPages
                                          )
                                        }
                                        className="cursor-pointer"
                                      >
                                        {pagination.totalPages}
                                      </PaginationLink>
                                    </PaginationItem>
                                  </>
                                )}

                                <PaginationItem>
                                  <PaginationNext
                                    onClick={() =>
                                      handlePageChange(
                                        Math.min(
                                          pagination.totalPages,
                                          pagination.page + 1
                                        )
                                      )
                                    }
                                    className={
                                      pagination.page === pagination.totalPages
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                    }
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
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

      {/* Add Stock Dialog */}
      <AddStockDialog
        isOpen={addStockDialogOpen}
        onClose={() => {
          setAddStockDialogOpen(false);
          setSelectedProductForStock(null);
        }}
        product={selectedProductForStock}
        onSuccess={() => {
          productsQuery.refetch(); // Refresh the product list
        }}
      />

      {/* Stock Reconciliation Dialog */}
      <StockReconciliationDialog
        isOpen={reconciliationDialogOpen}
        onClose={() => setReconciliationDialogOpen(false)}
        onSuccess={() => {
          productsQuery.refetch(); // Refresh the product list
        }}
      />
    </>
  );
}
