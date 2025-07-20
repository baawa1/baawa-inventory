"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  RefreshCw,
  Upload,
  XCircle,
  Globe,
  Package,
  Zap,
} from "lucide-react";
import type { DashboardTableColumn } from "@/components/layouts/DashboardColumnCustomizer";
import { InventoryPageLayout } from "@/components/inventory/InventoryPageLayout";
import type { FilterConfig } from "@/types/inventory";
import {
  useProductsWithSync,
  useSyncProduct,
  useBulkSyncProducts,
  useSyncAllProducts,
  type ProductWithSync,
  type WebflowSyncFilters,
} from "@/hooks/api/useWebflowSync";
import { useCategories } from "@/hooks/api/categories";
import { useBrands } from "@/hooks/api/brands";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { WebflowSyncDetailModal } from "@/components/webflow/WebflowSyncDetailModal";

interface WebflowSyncListProps {
  user: {
    id: string;
    role: string;
    name?: string | null;
    email?: string | null;
  };
}

const SYNC_STATUS_OPTIONS = [
  { value: "completed", label: "Synced" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "archived", label: "Archived" },
  { value: "never", label: "Never Synced" },
];

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "updatedAt-desc", label: "Recently Updated" },
  { value: "updatedAt-asc", label: "Least Recently Updated" },
  { value: "sync_status-asc", label: "Sync Status (A-Z)" },
  { value: "sync_status-desc", label: "Sync Status (Z-A)" },
  { value: "last_sync_at-desc", label: "Recently Synced" },
  { value: "last_sync_at-asc", label: "Least Recently Synced" },
];

const COLUMNS: DashboardTableColumn[] = [
  { key: "select", label: "", defaultVisible: true, required: true },
  {
    key: "product",
    label: "Product",
    defaultVisible: true,
    required: true,
    sortable: true,
  },
  { key: "sku", label: "SKU", defaultVisible: true },
  { key: "category", label: "Category", defaultVisible: true },
  { key: "brand", label: "Brand", defaultVisible: true },
  { key: "syncStatus", label: "Sync Status", defaultVisible: true },
  { key: "lastSync", label: "Last Sync", defaultVisible: true },
  { key: "webflowUrl", label: "Webflow Link", defaultVisible: true },
  { key: "autoSync", label: "Auto Sync", defaultVisible: false },
  // { key: "onlinePrice", label: "Online Price", defaultVisible: false }, // Not implemented yet
  { key: "showInWebflow", label: "Show in Webflow", defaultVisible: false },
  { key: "actions", label: "Actions", defaultVisible: true, required: true },
];

export function WebflowSyncList({ user }: WebflowSyncListProps) {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] =
    useState<ProductWithSync | null>(null);

  const [filters, setFilters] = useState<WebflowSyncFilters>({
    search: "",
    syncStatus: "",
    autoSync: "",
    showInWebflow: "",
    category: "",
    brand: "",
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 300);
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks
  const productsQuery = useProductsWithSync(
    {
      ...filters,
      search: debouncedSearchTerm,
    },
    {
      page: pagination.page,
      limit: pagination.limit,
    }
  );

  const categoriesQuery = useCategories({ status: "true" });
  const brandsQuery = useBrands({ status: "true" });
  const syncProductMutation = useSyncProduct();
  const bulkSyncMutation = useBulkSyncProducts();
  const syncAllMutation = useSyncAllProducts();

  // Extract data from queries
  const products = productsQuery.data?.data || [];
  const summary = productsQuery.data?.summary;
  const apiPagination = productsQuery.data?.pagination;

  // Update pagination state from API response
  const currentPagination = {
    page: apiPagination?.page || pagination.page,
    limit: apiPagination?.limit || pagination.limit,
    totalPages:
      apiPagination?.totalPages ||
      Math.ceil((apiPagination?.total || 0) / pagination.limit),
    totalItems: apiPagination?.total || 0,
  };

  // Permission checks
  const canSyncToWebflow = ["ADMIN", "MANAGER"].includes(user.role);

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "syncStatus",
        label: "Sync Status",
        type: "select",
        options: SYNC_STATUS_OPTIONS,
        placeholder: "All Statuses",
      },
      {
        key: "showInWebflow",
        label: "Show in Webflow",
        type: "select",
        options: [
          { value: "true", label: "Enabled" },
          { value: "false", label: "Disabled" },
        ],
        placeholder: "All Products",
      },
      {
        key: "autoSync",
        label: "Auto Sync",
        type: "select",
        options: [
          { value: "true", label: "Enabled" },
          { value: "false", label: "Disabled" },
        ],
        placeholder: "All Settings",
      },
      {
        key: "category",
        label: "Category",
        type: "select",
        options:
          categoriesQuery.data?.data?.map((cat: any) => ({
            value: cat.id.toString(),
            label: cat.name,
          })) || [],
        placeholder: "All Categories",
      },
      {
        key: "brand",
        label: "Brand",
        type: "select",
        options:
          brandsQuery.data?.data?.map((brand: any) => ({
            value: brand.id.toString(),
            label: brand.name,
          })) || [],
        placeholder: "All Brands",
      },
    ],
    [categoriesQuery.data, brandsQuery.data]
  );

  // Event handlers
  const handleFilterChange = useCallback(
    (key: string, value: string | boolean) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
      setPagination((prev) => ({ ...prev, page: 1 }));
      setSelectedProducts([]); // Clear selection when filters change
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: "",
      syncStatus: "",
      autoSync: "",
      showInWebflow: "",
      category: "",
      brand: "",
      sortBy: "updatedAt",
      sortOrder: "desc",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedProducts([]);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    const [sortBy, sortOrder] = value.split("-");
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
    }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      limit: newPageSize,
      page: 1,
    }));
  }, []);

  // Selection handlers
  const _handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedProducts(products.map((product) => product.id));
      } else {
        setSelectedProducts([]);
      }
    },
    [products]
  );

  const handleSelectProduct = useCallback(
    (productId: number, checked: boolean) => {
      setSelectedProducts((prev) => {
        if (checked) {
          return [...prev, productId];
        } else {
          return prev.filter((id) => id !== productId);
        }
      });
    },
    []
  );

  // Sync handlers
  const handleSyncProduct = useCallback(
    (productId: number, forceSync = false) => {
      syncProductMutation.mutate({ productId, forceSync });
    },
    [syncProductMutation]
  );

  const handleBulkSync = useCallback(() => {
    if (selectedProducts.length === 0) {
      return;
    }
    bulkSyncMutation.mutate(selectedProducts);
  }, [selectedProducts, bulkSyncMutation]);

  const handleSyncAll = useCallback(() => {
    syncAllMutation.mutate();
  }, [syncAllMutation]);

  const handleViewDetails = useCallback((product: ProductWithSync) => {
    setSelectedProductForDetail(product);
    setDetailModalOpen(true);
  }, []);

  // Render functions
  const renderSyncStatus = (product: ProductWithSync) => {
    const sync = product.webflowSync;

    if (!sync) {
      return <Badge variant="secondary">Never Synced</Badge>;
    }

    switch (sync.sync_status) {
      case "synced":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 border-green-200"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Synced
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="default"
            className="bg-yellow-100 text-yellow-800 border-yellow-200"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Archived
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderCell = useCallback(
    (product: ProductWithSync, columnKey: string) => {
      switch (columnKey) {
        case "select":
          return (
            <Checkbox
              checked={selectedProducts.includes(product.id)}
              onCheckedChange={(checked) =>
                handleSelectProduct(product.id, checked as boolean)
              }
            />
          );

        case "product":
          return (
            <div className="flex items-center gap-3">
              {product.images?.[0] && (
                <img
                  src={product.images[0].url || product.images[0]}
                  alt={product.name}
                  className="h-10 w-10 rounded object-cover"
                />
              )}
              <div>
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(product.price)}
                </div>
              </div>
            </div>
          );

        case "sku":
          return <code className="text-sm">{product.sku}</code>;

        case "category":
          return product.category?.name || "—";

        case "brand":
          return product.brand?.name || "—";

        case "syncStatus":
          return renderSyncStatus(product);

        case "lastSync":
          const sync = product.webflowSync;
          if (!sync?.last_sync_at) {
            return <span className="text-muted-foreground">Never</span>;
          }
          return (
            <div className="text-sm">
              <div>
                {formatDistanceToNow(new Date(sync.last_sync_at), {
                  addSuffix: true,
                })}
              </div>
              {sync.sync_errors && (
                <div
                  className="text-xs text-red-600 truncate max-w-32"
                  title={sync.sync_errors}
                >
                  Error: {sync.sync_errors}
                </div>
              )}
            </div>
          );

        case "webflowUrl":
          const webflowUrl = product.webflowSync?.webflow_url;
          if (!webflowUrl) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <Button variant="ghost" size="sm" asChild className="h-auto p-1">
              <a href={webflowUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          );

        case "autoSync":
          return product.webflowSync?.auto_sync ? (
            <Badge
              variant="default"
              className="bg-blue-100 text-blue-800 border-blue-200"
            >
              <Zap className="h-3 w-3 mr-1" />
              Auto
            </Badge>
          ) : (
            <Badge variant="outline">Manual</Badge>
          );

        // case "onlinePrice": // Not implemented yet
        //   return product.onlinePrice
        //     ? formatCurrency(product.onlinePrice)
        //     : "—";

        case "showInWebflow":
          return product.showInWebflow ? (
            <Badge
              variant="default"
              className="bg-green-100 text-green-800 border-green-200"
            >
              <Globe className="h-3 w-3 mr-1" />
              Yes
            </Badge>
          ) : (
            <Badge variant="secondary">No</Badge>
          );

        default:
          return "—";
      }
    },
    [selectedProducts, handleSelectProduct]
  );

  const renderActions = useCallback(
    (product: ProductWithSync) => {
      if (!canSyncToWebflow) {
        return null;
      }

      const canSync = product.showInWebflow;
      const syncStatus = product.webflowSync?.sync_status;
      const isLoading = syncProductMutation.isPending;

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(product)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {canSync && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                handleSyncProduct(product.id, syncStatus === "failed")
              }
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          )}

          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
            <Link href={`/inventory/products/${product.id}/edit`}>
              <Package className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      );
    },
    [
      canSyncToWebflow,
      syncProductMutation.isPending,
      handleViewDetails,
      handleSyncProduct,
    ]
  );

  const _isAllSelected =
    products.length > 0 && selectedProducts.length === products.length;
  const _isIndeterminate =
    selectedProducts.length > 0 && selectedProducts.length < products.length;

  return (
    <>
      <InventoryPageLayout
        // Header
        title="Webflow Sync"
        description="Manage product synchronization to your Webflow CMS"
        actions={
          canSyncToWebflow ? (
            <div className="flex items-center gap-2">
              {selectedProducts.length > 0 && (
                <Button
                  onClick={handleBulkSync}
                  disabled={bulkSyncMutation.isPending}
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Sync Selected ({selectedProducts.length})
                </Button>
              )}
              <Button
                onClick={handleSyncAll}
                disabled={syncAllMutation.isPending}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${syncAllMutation.isPending ? "animate-spin" : ""}`}
                />
                Sync All
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
        // Quick filters for sync status
        quickFilters={
          summary ? (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">Total: {summary.totalProducts}</Badge>
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 border-green-200"
              >
                Synced: {summary.syncedProducts}
              </Badge>
              <Badge
                variant="default"
                className="bg-yellow-100 text-yellow-800 border-yellow-200"
              >
                Pending: {summary.pendingProducts}
              </Badge>
              <Badge variant="destructive">
                Failed: {summary.failedProducts}
              </Badge>
              <Badge variant="secondary">
                Not Synced: {summary.notSyncedProducts}
              </Badge>
            </div>
          ) : undefined
        }
        // Sort
        sortOptions={SORT_OPTIONS}
        currentSort={`${filters.sortBy}-${filters.sortOrder}`}
        onSortChange={handleSortChange}
        // Table
        tableTitle="Products"
        totalCount={currentPagination.totalItems}
        currentCount={products.length}
        columns={COLUMNS}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="webflow-sync-visible-columns"
        data={products}
        renderCell={renderCell}
        renderActions={renderActions}
        // Pagination
        pagination={currentPagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        // Loading states
        isLoading={productsQuery.isLoading}
        isRefetching={productsQuery.isFetching && !productsQuery.isLoading}
        error={productsQuery.error?.message}
        onRetry={() => productsQuery.refetch()}
        // Empty state
        emptyStateIcon={
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        }
        emptyStateMessage="No products found for Webflow sync"
        emptyStateAction={
          canSyncToWebflow ? (
            <Button asChild>
              <Link href="/inventory/products/add">Add Your First Product</Link>
            </Button>
          ) : undefined
        }
      />

      {/* Sync Detail Modal */}
      <WebflowSyncDetailModal
        product={selectedProductForDetail}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </>
  );
}
