"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InventoryPageLayout } from "@/components/inventory/InventoryPageLayout";
import { IconDownload, IconTrendingUp, IconHistory } from "@tabler/icons-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { FilterConfig, SortOption, PaginationState } from "@/types/inventory";

interface StockHistoryItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  supplier?: {
    id: string;
    name: string;
  };
  purchaseDate: string;
  referenceNumber?: string;
  notes?: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  previousStock?: number;
  newStock?: number;
}

interface StockHistoryListProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
  };
}

export function StockHistoryList({ user: _user }: StockHistoryListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  const {
    data: stockHistory,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "stock-history",
      {
        search: searchTerm,
        sort: sortBy,
        order: sortOrder,
        supplier: supplierFilter,
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchTerm,
        sortBy,
        sortOrder,
        ...(supplierFilter !== "all" && { supplier: supplierFilter }),
      });

      const response = await fetch(`/api/stock-additions?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stock history");
      }
      return response.json();
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) {
        throw new Error("Failed to fetch suppliers");
      }
      return response.json();
    },
  });

  const exportStockHistory = async () => {
    try {
      const response = await fetch("/api/stock-additions/export", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export stock history");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stock-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Stock history exported successfully");
    } catch (_error) {
      toast.error("Failed to export stock history");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const handleFilterChange = (key: string, value: any) => {
    if (key === "supplier") {
      if (supplierFilter === value) return; // Prevent unnecessary updates
      setSupplierFilter(value);
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSupplierFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("-");
    setSortBy(field);
    setSortOrder(order as "asc" | "desc");
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

  const renderCell = (item: StockHistoryItem, columnKey: string) => {
    switch (columnKey) {
      case "date":
        return (
          <div className="text-sm">
            <div className="font-medium">
              {format(new Date(item.createdAt), "MMM dd, yyyy")}
            </div>
            <div className="text-gray-500">
              {format(new Date(item.createdAt), "HH:mm")}
            </div>
          </div>
        );
      case "product":
        return (
          <div>
            <div className="font-medium">{item.product.name}</div>
            <div className="text-sm text-gray-500">{item.product.sku}</div>
          </div>
        );
      case "previous_stock":
        return (
          <Badge variant="secondary">{item.previousStock || 0} units</Badge>
        );
      case "added":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <IconTrendingUp className="h-3 w-3 mr-1" />+{item.quantity}
          </Badge>
        );
      case "new_stock":
        return (
          <Badge variant="outline">
            {(item.previousStock || 0) + item.quantity} units
          </Badge>
        );
      case "cost_per_unit":
        return formatCurrency(item.costPerUnit);
      case "total_cost":
        return (
          <span className="font-medium">{formatCurrency(item.totalCost)}</span>
        );
      case "supplier":
        return item.supplier ? (
          <Badge variant="outline">{item.supplier.name}</Badge>
        ) : (
          <span className="text-gray-400">-</span>
        );
      case "reference":
        return item.referenceNumber ? (
          <Badge variant="secondary" className="font-mono text-xs">
            {item.referenceNumber}
          </Badge>
        ) : (
          <span className="text-gray-400">-</span>
        );
      case "added_by":
        return <div className="text-sm">{item.createdBy.name}</div>;
      default:
        return "-";
    }
  };

  const columns = [
    { key: "date", label: "Date/Time", sortable: true },
    { key: "product", label: "Product", sortable: true },
    { key: "previous_stock", label: "Previous Stock", sortable: false },
    { key: "added", label: "Added", sortable: true },
    { key: "new_stock", label: "New Stock", sortable: false },
    { key: "cost_per_unit", label: "Cost per Unit", sortable: true },
    { key: "total_cost", label: "Total Cost", sortable: true },
    { key: "supplier", label: "Supplier", sortable: true },
    { key: "reference", label: "Reference", sortable: false },
    { key: "added_by", label: "Added By", sortable: true },
  ];

  const filterConfigs: FilterConfig[] = [
    {
      key: "supplier",
      label: "Suppliers",
      type: "select",
      options: [
        { value: "all", label: "All Suppliers" },
        ...(suppliers?.data?.map((supplier: any) => ({
          value: supplier.id,
          label: supplier.name,
        })) || []),
      ],
      placeholder: "All Suppliers",
    },
  ];

  const sortOptions: SortOption[] = [
    { value: "createdAt-desc", label: "Newest First" },
    { value: "createdAt-asc", label: "Oldest First" },
    { value: "product-asc", label: "Product A-Z" },
    { value: "product-desc", label: "Product Z-A" },
    { value: "quantity-desc", label: "Highest Quantity" },
    { value: "quantity-asc", label: "Lowest Quantity" },
    { value: "totalCost-desc", label: "Highest Cost" },
    { value: "totalCost-asc", label: "Lowest Cost" },
  ];

  // Update pagination when data changes
  useEffect(() => {
    const data = stockHistory?.data || [];
    setPagination((prev) => ({
      ...prev,
      totalPages: Math.ceil(data.length / prev.limit),
      totalItems: data.length,
    }));
  }, [stockHistory?.data]);

  return (
    <InventoryPageLayout
      // Header
      title="Stock History"
      description="Track all stock additions and purchases made to your inventory"
      actions={
        <Button
          onClick={exportStockHistory}
          variant="outline"
          className="gap-2"
        >
          <IconDownload className="h-4 w-4" />
          Export
        </Button>
      }
      // Filters
      searchPlaceholder="Search by product name, SKU, or reference number..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      isSearching={false}
      filters={filterConfigs}
      filterValues={{ supplier: supplierFilter }}
      onFilterChange={handleFilterChange}
      onResetFilters={handleResetFilters}
      // Sort
      sortOptions={sortOptions}
      currentSort={`${sortBy}-${sortOrder}`}
      onSortChange={handleSortChange}
      // Table
      tableTitle="Stock History"
      totalCount={stockHistory?.data?.length || 0}
      currentCount={stockHistory?.data?.length || 0}
      showingText={`Showing ${stockHistory?.data?.length || 0} stock additions`}
      columns={columns}
      visibleColumns={columns.map((col) => col.key)}
      onColumnsChange={undefined}
      columnCustomizerKey={undefined}
      data={stockHistory?.data || []}
      renderCell={renderCell}
      renderActions={undefined}
      // Pagination
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      // Loading states
      isLoading={isLoading}
      isRefetching={false}
      error={error ? String(error) : undefined}
      onRetry={() => refetch()}
      // Empty state
      emptyStateIcon={
        <IconHistory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      }
      emptyStateMessage="No stock history found"
    />
  );
}
