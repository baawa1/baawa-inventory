"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { useProducts, type Product as APIProduct } from "@/hooks/api/products";
import { useBrands } from "@/hooks/api/brands";
import { useCategories } from "@/hooks/api/categories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InventoryPageLayout } from "@/components/inventory/InventoryPageLayout";
import { AddStockDialog } from "@/components/inventory/AddStockDialog";
import { StockReconciliationDialog } from "@/components/inventory/StockReconciliationDialog";
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconAdjustments,
  IconPackages,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { FilterConfig, SortOption, PaginationState } from "@/types/inventory";
import { PRODUCT_COLUMNS } from "@/components/inventory/ColumnCustomizer";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface ProductListProps {
  user: User;
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

const SORT_OPTIONS: SortOption[] = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "createdAt-desc", label: "Newest First" },
  { value: "createdAt-asc", label: "Oldest First" },
  { value: "stock-asc", label: "Stock (Low to High)" },
  { value: "stock-desc", label: "Stock (High to Low)" },
  { value: "price-asc", label: "Price (Low to High)" },
  { value: "price-desc", label: "Price (High to Low)" },
];

export function ProductList({ user }: ProductListProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    category: "",
    brand: "",
    status: "",
    supplier: "",
    lowStock: false,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Dialog states
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] =
    useState<APIProduct | null>(null);
  const [reconciliationDialogOpen, setReconciliationDialogOpen] =
    useState(false);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 300);
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks
  const productsQuery = useProducts(
    {
      search: debouncedSearchTerm,
      category: filters.category,
      brand: filters.brand,
      status: filters.status,
      supplier: filters.supplier,
      lowStock: filters.lowStock,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    },
    {
      page: pagination.page,
      limit: pagination.limit,
    }
  );

  const brandsQuery = useBrands({ isActive: true });
  const categoriesQuery = useCategories({ status: "active" });

  // Extract data from queries
  const products = productsQuery.data?.data || [];
  const brands = brandsQuery.data?.data || [];
  const categories = categoriesQuery.data?.data || [];

  const canManageProducts = ["ADMIN", "MANAGER"].includes(user.role);
  const canEditProducts = ["ADMIN", "MANAGER", "STAFF"].includes(user.role);

  // Filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      key: "category",
      label: "Categories",
      type: "select",
      options: categories.map((cat) => ({ value: cat.name, label: cat.name })),
      placeholder: "All Categories",
    },
    {
      key: "brand",
      label: "Brands",
      type: "select",
      options: brands.map((brand) => ({
        value: brand.name,
        label: brand.name,
      })),
      placeholder: "All Brands",
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "discontinued", label: "Discontinued" },
      ],
      placeholder: "All Status",
    },
  ];

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => {
      const filterKey = key as keyof ProductFilters;
      if (prev[filterKey] === value) return prev; // Prevent unnecessary updates
      return { ...prev, [filterKey]: value };
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      category: "",
      brand: "",
      status: "",
      supplier: "",
      lowStock: false,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split("-");
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
    }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      limit: newPageSize,
      page: 1,
    }));
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
    } else if (product.stock <= product.minStock) {
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

  const renderCell = (product: APIProduct, columnKey: string) => {
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
            <span className="text-gray-400">/ {product.minStock} min</span>
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
      case "minStock":
        return product.minStock;
      case "maxStock":
        return product.maxStock || "-";
      case "unit":
        return product.unit;
      case "createdAt":
        return new Date(product.createdAt).toLocaleDateString();
      case "updatedAt":
        return new Date(product.updatedAt).toLocaleDateString();
      default:
        return "-";
    }
  };

  const renderActions = (product: APIProduct) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <IconDots className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link
            href={`/inventory/products/${product.id}`}
            className="flex items-center gap-2"
          >
            <IconEye className="h-4 w-4" />
            View Details
          </Link>
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
  );

  // Update pagination state when API response changes
  useEffect(() => {
    if (productsQuery.data?.pagination) {
      const apiPagination = productsQuery.data.pagination;
      setPagination((prev) => ({
        ...prev,
        totalPages:
          apiPagination.totalPages ||
          Math.ceil((apiPagination.total || 0) / prev.limit),
        totalItems: apiPagination.total || 0,
      }));
    }
  }, [productsQuery.data?.pagination]);

  return (
    <InventoryPageLayout
      // Header
      title="Products"
      description="Manage your product inventory and stock levels"
      actions={
        canManageProducts ? (
          <>
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
          </>
        ) : undefined
      }
      // Filters
      searchPlaceholder="Search products..."
      searchValue={filters.search}
      onSearchChange={(value) => handleFilterChange("search", value)}
      isSearching={isSearching}
      filters={filterConfigs}
      filterValues={filters}
      onFilterChange={handleFilterChange}
      onResetFilters={handleResetFilters}
      quickFilters={
        <Button
          variant={filters.lowStock ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("lowStock", !filters.lowStock)}
        >
          <IconAlertTriangle className="h-4 w-4 mr-1" />
          Low Stock Only
        </Button>
      }
      // Sort
      sortOptions={SORT_OPTIONS}
      currentSort={`${filters.sortBy}-${filters.sortOrder}`}
      onSortChange={handleSortChange}
      // Table
      tableTitle="Products"
      totalCount={pagination.totalItems}
      currentCount={products.length}
      columns={PRODUCT_COLUMNS}
      visibleColumns={visibleColumns}
      onColumnsChange={setVisibleColumns}
      columnCustomizerKey="products-visible-columns"
      data={products}
      renderCell={renderCell}
      renderActions={renderActions}
      // Pagination
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      // Loading states
      isLoading={productsQuery.isLoading}
      isRefetching={productsQuery.isFetching && !productsQuery.isLoading}
      error={productsQuery.error?.message}
      onRetry={() => productsQuery.refetch()}
      // Empty state
      emptyStateIcon={
        <IconPackages className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      }
      emptyStateMessage="No products found"
      emptyStateAction={
        canManageProducts ? (
          <Button asChild>
            <Link href="/inventory/products/add">Add Your First Product</Link>
          </Button>
        ) : undefined
      }
      // Additional content
      additionalContent={
        <>
          <AddStockDialog
            isOpen={addStockDialogOpen}
            onClose={() => {
              setAddStockDialogOpen(false);
              setSelectedProductForStock(null);
            }}
            product={selectedProductForStock}
            onSuccess={() => {
              productsQuery.refetch();
            }}
          />
          <StockReconciliationDialog
            isOpen={reconciliationDialogOpen}
            onClose={() => setReconciliationDialogOpen(false)}
            onSuccess={() => {
              productsQuery.refetch();
            }}
          />
        </>
      }
    />
  );
}
