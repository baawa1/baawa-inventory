"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

// Hooks
import { useDebounce } from "@/hooks/useDebounce";
import { useProducts, type Product as APIProduct } from "@/hooks/api/products";
import { useBrands } from "@/hooks/api/brands";
import { useCategories } from "@/hooks/api/categories";

// UI Components
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

// Custom Components
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { InventoryPageLayout } from "@/components/inventory/InventoryPageLayout";
import { AddStockDialog } from "@/components/inventory/AddStockDialog";
import { ProductDetailModal } from "@/components/inventory/ProductDetailModal";
import { PRODUCT_COLUMNS } from "@/components/inventory/ColumnCustomizer";

// Icons
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconAdjustments,
  IconPackages,
  IconAlertTriangle,
  IconArchive,
  IconPhoto,
} from "@tabler/icons-react";

// Utils and Types
import { formatCurrency } from "@/lib/utils";
import { ErrorHandlers } from "@/lib/utils/error-handling";
import { FilterConfig, SortOption, PaginationState } from "@/types/inventory";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface ProductListProps {
  user: User;
}

interface ProductFilters {
  search: string;
  categoryId: string;
  brandId: string;
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
    categoryId: "",
    brandId: "",
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
  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<
    number | null
  >(null);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 300);
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks
  const productsQuery = useProducts(
    {
      search: debouncedSearchTerm,
      categoryId: filters.categoryId,
      brandId: filters.brandId,
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

  const brandsQuery = useBrands({ status: "true" });
  const categoriesQuery = useCategories({ status: "true" });

  // Extract data from queries
  const products = productsQuery.data?.data || [];
  const brands = brandsQuery.data?.data || [];
  const categories = categoriesQuery.data?.data || [];

  const canManageProducts = ["ADMIN", "MANAGER"].includes(user.role);
  const canEditProducts = ["ADMIN", "MANAGER", "STAFF"].includes(user.role);

  // Memoize category options to prevent unnecessary re-renders
  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: String(cat.id),
        label: cat.name,
      })),
    [categories]
  );

  // Memoize brand options to prevent unnecessary re-renders
  const brandOptions = useMemo(
    () =>
      brands.map((brand) => ({
        value: String(brand.id),
        label: brand.name,
      })),
    [brands]
  );

  // Static status options (no need to memoize)
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "discontinued", label: "Discontinued" },
  ];

  // Filter configurations - properly memoized to prevent unnecessary re-renders
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "categoryId",
        label: "Categories",
        type: "select",
        options: categoryOptions,
        placeholder: "All Categories",
      },
      {
        key: "brandId",
        label: "Brands",
        type: "select",
        options: brandOptions,
        placeholder: "All Brands",
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: statusOptions,
        placeholder: "All Status",
      },
    ],
    [categoryOptions, brandOptions]
  );

  const handleFilterChange = (key: string, value: string | boolean) => {
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
      categoryId: "",
      brandId: "",
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

  // Archive product handler
  const handleArchiveProduct = async (
    productId: number,
    productName: string
  ) => {
    try {
      const response = await fetch(`/api/products/${productId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archived: true,
          reason: `Archived by ${user.role}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive product");
      }

      toast.success(`Product "${productName}" has been archived`);
      productsQuery.refetch(); // Refresh the products list
    } catch (err) {
      ErrorHandlers.api(err, "Failed to archive product");
    }
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

  // Helper function to get product image - moved outside render for better performance
  const getProductImage = (product: APIProduct): string => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      // Check if it's the new format (array of objects)
      if (typeof product.images[0] === "object" && "url" in product.images[0]) {
        return (product.images[0] as any).url;
      }
      // Legacy format (array of strings)
      return product.images[0] as string;
    }
    return product.image || "";
  };

  const isValidUrl = (url: string): boolean => {
    return (
      url.startsWith("/") ||
      url.startsWith("http://") ||
      url.startsWith("https://")
    );
  };

  const renderCell = (product: APIProduct, columnKey: string) => {
    switch (columnKey) {
      case "image":
        const productImage = getProductImage(product);

        return (
          <div className="flex items-center justify-start">
            {productImage &&
            productImage.trim() !== "" &&
            isValidUrl(productImage.trim()) ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                <Image
                  src={productImage}
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
        <DropdownMenuItem
          onClick={() => {
            setSelectedProductForDetail(product.id);
            setProductDetailModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <IconEye className="h-4 w-4" />
          View Details
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
            <DropdownMenuItem asChild>
              <Link
                href={`/inventory/products/${product.id}/images`}
                className="flex items-center gap-2"
              >
                <IconPhoto className="h-4 w-4" />
                Manage Images
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
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleArchiveProduct(product.id, product.name)}
            >
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
    <ErrorBoundary>
      <InventoryPageLayout
        // Header
        title="Products"
        description="Manage your product inventory and stock levels"
        actions={
          canManageProducts ? (
            <div className="flex flex-row items-center gap-2">
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2"
              >
                <Link href="/inventory/products/archived">
                  <IconArchive className="h-4 w-4" />
                  View Archived
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2"
              >
                <Link href="/inventory/stock-reconciliations/add">
                  <IconAdjustments className="h-4 w-4" />
                  Reconcile Stock
                </Link>
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
            <ProductDetailModal
              productId={selectedProductForDetail}
              open={productDetailModalOpen}
              onCloseAction={() => {
                setProductDetailModalOpen(false);
                setSelectedProductForDetail(null);
              }}
              onAddStock={(productId) => {
                // Find the product and set it for the AddStockDialog
                const product = products?.find((p) => p.id === productId);
                if (product) {
                  setSelectedProductForStock(product);
                  setAddStockDialogOpen(true);
                  // Close the detail modal
                  setProductDetailModalOpen(false);
                  setSelectedProductForDetail(null);
                }
              }}
            />
          </>
        }
      />
    </ErrorBoundary>
  );
}
