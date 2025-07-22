"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InventoryPageLayout } from "@/components/inventory/InventoryPageLayout";
import { AlertTriangle, Package, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { PaginationState } from "@/types/inventory";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  cost: number;
  price: number;
  status: string;
  category: { id: number; name: string } | null;
  brand: { id: number; name: string } | null;
  supplier: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface LowStockMetrics {
  totalValue: number;
  criticalStock: number;
  lowStock: number;
  totalProducts: number;
}

interface LowStockResponse {
  products: LowStockProduct[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  metrics: LowStockMetrics;
}

const fetchLowStockProducts = async (
  offset: number = 0,
  limit: number = 10,
  search: string = ""
): Promise<LowStockResponse> => {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  });

  if (search) {
    params.append("search", search);
  }

  const response = await fetch(`/api/products/low-stock?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch low stock products");
  }
  return response.json();
};

const getStockStatusColor = (stock: number, minStock: number) => {
  if (stock === 0) return "destructive";
  if (stock <= minStock * 0.5) return "destructive";
  if (stock <= minStock) return "secondary";
  return "default";
};

const getStockStatusIcon = (stock: number, minStock: number) => {
  if (stock === 0 || stock <= minStock * 0.5) {
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
  if (stock <= minStock) {
    return <Package className="h-4 w-4 text-orange-500" />;
  }
  return <Package className="h-4 w-4" />;
};

const getStockStatusText = (stock: number, minStock: number) => {
  if (stock === 0) return "OUT OF STOCK";
  if (stock <= minStock * 0.5) return "CRITICAL";
  if (stock <= minStock) return "LOW";
  return "NORMAL";
};

export function LowStockAlerts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  const {
    data: response,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      "low-stock-products",
      pagination.page,
      pagination.limit,
      searchTerm,
    ],
    queryFn: () =>
      fetchLowStockProducts(
        (pagination.page - 1) * pagination.limit,
        pagination.limit,
        searchTerm
      ),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const products = response?.products || [];
  const metrics = response?.metrics || {
    totalValue: 0,
    criticalStock: 0,
    lowStock: 0,
    totalProducts: 0,
  };

  // Update pagination when response changes
  useEffect(() => {
    if (response?.pagination) {
      setPagination((prev) => ({
        ...prev,
        totalPages: Math.ceil(response.pagination.total / prev.limit),
        totalItems: response.pagination.total,
      }));
    }
  }, [response?.pagination]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [searchTerm]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Low stock data refreshed");
    } catch (_error) {
      toast.error("Failed to refresh data");
    }
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

  const getStatusBadge = (status: LowStockProduct["status"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="default" className="bg-green-500">
            Active
          </Badge>
        );
      case "INACTIVE":
        return <Badge variant="secondary">Inactive</Badge>;
      case "OUT_OF_STOCK":
        return (
          <Badge variant="secondary" className="bg-yellow-500">
            Out of Stock
          </Badge>
        );
      case "DISCONTINUED":
        return (
          <Badge variant="secondary" className="bg-gray-500">
            Discontinued
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStockStatusBadge = (stock: number, minStock: number) => {
    const status = getStockStatusText(stock, minStock);
    const color = getStockStatusColor(stock, minStock);
    return <Badge variant={color}>{status}</Badge>;
  };

  const renderCell = (product: LowStockProduct, columnKey: string) => {
    switch (columnKey) {
      case "product":
        return (
          <div className="flex items-center gap-2">
            {getStockStatusIcon(product.stock, product.minStock)}
            <div>
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-gray-500">SKU: {product.sku}</div>
            </div>
          </div>
        );
      case "category":
        return product.category?.name || "-";
      case "brand":
        return product.brand?.name || "-";
      case "stock":
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{product.stock}</span>
            <span className="text-gray-400">/ {product.minStock} min</span>
          </div>
        );
      case "status":
        return getStockStatusBadge(product.stock, product.minStock);
      case "cost":
        return formatCurrency(product.cost);
      case "price":
        return formatCurrency(product.price);
      case "supplier":
        return product.supplier?.name || "-";
      case "product_status":
        return getStatusBadge(product.status);
      default:
        return "-";
    }
  };

  const columns = [
    { key: "product", label: "Product", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "brand", label: "Brand", sortable: true },
    { key: "stock", label: "Current Stock", sortable: true },
    { key: "status", label: "Stock Status", sortable: false },
    { key: "cost", label: "Cost Price", sortable: true },
    { key: "price", label: "Selling Price", sortable: true },
    { key: "supplier", label: "Supplier", sortable: true },
    { key: "product_status", label: "Status", sortable: false },
  ];

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Error Loading Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Failed to load low stock products. Please try again later.
          </p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <InventoryPageLayout
      // Header
      title="Low Stock Alerts"
      description="Monitor and manage products with low stock levels"
      actions={
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isRefetching}
        >
          <IconRefresh
            className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      }
      // Filters
      searchPlaceholder="Search by product name, SKU, category, or brand..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      isSearching={false}
      filters={[]}
      filterValues={{}}
      onFilterChange={() => {}}
      onResetFilters={() => {}}
      beforeFiltersContent={
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Stock Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Critical Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-2xl font-bold text-red-600">
                      {isLoading || isRefetching ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        metrics.criticalStock
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Products requiring immediate attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Low Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-orange-500" />
                    <span className="text-2xl font-bold text-orange-600">
                      {isLoading || isRefetching ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        metrics.lowStock
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Products below minimum threshold
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl font-bold text-blue-600">
                      {isLoading || isRefetching ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        formatCurrency(metrics.totalValue)
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total value of low stock items
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      }
      // Table
      tableTitle="Low Stock Products"
      totalCount={pagination.totalItems}
      currentCount={products.length}
      columns={columns}
      visibleColumns={columns.map((col) => col.key)}
      onColumnsChange={undefined}
      columnCustomizerKey={undefined}
      data={products}
      renderCell={renderCell}
      renderActions={undefined}
      // Pagination
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      // Loading states
      isLoading={isLoading}
      isRefetching={isRefetching}
      error={error ? String(error) : undefined}
      onRetry={() => refetch()}
      // Empty state
      emptyStateIcon={
        <IconAlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      }
      emptyStateMessage="No low stock products found"
    />
  );
}
