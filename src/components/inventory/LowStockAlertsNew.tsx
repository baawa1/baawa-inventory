"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InventoryPageLayout } from "@/components/inventory/InventoryPageLayout";
import {
  IconPackages,
  IconAlertTriangle,
  IconRefresh,
  IconDownload,
  IconTrendingUp,
} from "@tabler/icons-react";
import { AlertTriangle, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { FilterConfig, SortOption, PaginationState } from "@/types/inventory";

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
  min_stock: number;
  cost: number;
  price: number;
  status: string;
  category: { id: number; name: string } | null;
  brand: { id: number; name: string } | null;
  supplier: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
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

interface LowStockFilters {
  search: string;
  category: string;
  brand: string;
  supplier: string;
  threshold: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const SORT_OPTIONS: SortOption[] = [
  { value: "stock-asc", label: "Stock (Low to High)" },
  { value: "stock-desc", label: "Stock (High to Low)" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "min_stock-desc", label: "Min Stock (High to Low)" },
  { value: "created_at-desc", label: "Newest First" },
];

export function LowStockAlerts() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<LowStockProduct[]>(
    []
  );
  const [metrics, setMetrics] = useState<LowStockMetrics>({
    totalValue: 0,
    criticalStock: 0,
    lowStock: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [filters, setFilters] = useState<LowStockFilters>({
    search: "",
    category: "",
    brand: "",
    supplier: "",
    threshold: "",
    sortBy: "stock",
    sortOrder: "asc",
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0,
  });

  // Check if user can edit reorder levels (admin and manager only)
  const canEdit =
    session?.user?.role && ["ADMIN", "MANAGER"].includes(session.user.role);

  useEffect(() => {
    fetchLowStockProducts();
    fetchFilterOptions();
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    // Apply client-side filtering and sorting
    let filtered = [...products];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    const [sortField, sortDirection] = filters.sortBy.includes("-")
      ? filters.sortBy.split("-")
      : [filters.sortBy, filters.sortOrder];

    filtered.sort((a, b) => {
      let aVal = a[sortField as keyof LowStockProduct];
      let bVal = b[sortField as keyof LowStockProduct];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredProducts(filtered);
  }, [products, filters.search, filters.sortBy, filters.sortOrder]);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.brand) params.append("brand", filters.brand);
      if (filters.supplier) params.append("supplier", filters.supplier);
      if (filters.threshold) params.append("threshold", filters.threshold);
      params.append("limit", pagination.limit.toString());
      params.append(
        "offset",
        ((pagination.page - 1) * pagination.limit).toString()
      );

      const response = await fetch(`/api/products/low-stock?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LowStockResponse = await response.json();
      setProducts(data.products);
      setMetrics(data.metrics);
      setPagination((prev) => ({
        ...prev,
        totalItems: data.pagination.total,
        totalPages: Math.ceil(data.pagination.total / pagination.limit),
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch low stock products"
      );
      toast.error("Failed to load low stock products");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [categoriesRes, brandsRes, suppliersRes] = await Promise.all([
        fetch("/api/categories?isActive=true"),
        fetch("/api/brands?isActive=true"),
        fetch("/api/suppliers?isActive=true"),
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.data || []);
      }

      if (brandsRes.ok) {
        const brandsData = await brandsRes.json();
        setBrands(brandsData.data || []);
      }

      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliers(suppliersData.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  };

  const handleFilterChange = (key: keyof LowStockFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSortChange = (value: string) => {
    if (value.includes("-")) {
      const [sortBy, sortOrder] = value.split("-");
      setFilters((prev) => ({
        ...prev,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
      }));
    } else {
      setFilters((prev) => ({ ...prev, sortBy: value }));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      category: "",
      brand: "",
      supplier: "",
      threshold: "",
      sortBy: "stock",
      sortOrder: "asc",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRefresh = () => {
    fetchLowStockProducts();
    toast.success("Low stock data refreshed");
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.brand) params.append("brand", filters.brand);
      if (filters.supplier) params.append("supplier", filters.supplier);
      if (filters.threshold) params.append("threshold", filters.threshold);
      params.append("export", "csv");

      const response = await fetch(`/api/products/low-stock?${params}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `low-stock-products-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Low stock report exported successfully");
    } catch (error) {
      toast.error("Failed to export low stock report");
    }
  };

  const getStockLevelBadge = (stock: number, minStock: number) => {
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Out of Stock
        </Badge>
      );
    } else if (stock <= minStock * 0.5) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Critical
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Package className="h-3 w-3" />
          Low Stock
        </Badge>
      );
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: "category",
      label: "Category",
      type: "select",
      options: categories.map((cat) => ({
        label: cat.name,
        value: cat.id.toString(),
      })),
      placeholder: "All Categories",
    },
    {
      key: "brand",
      label: "Brand",
      type: "select",
      options: brands.map((brand) => ({
        label: brand.name,
        value: brand.id.toString(),
      })),
      placeholder: "All Brands",
    },
    {
      key: "supplier",
      label: "Supplier",
      type: "select",
      options: suppliers.map((supplier) => ({
        label: supplier.name,
        value: supplier.id.toString(),
      })),
      placeholder: "All Suppliers",
    },
    {
      key: "threshold",
      label: "Stock Threshold",
      type: "select",
      options: [
        { label: "Auto (≤ Min Stock)", value: "" },
        { label: "≤ 10 units", value: "10" },
        { label: "≤ 25 units", value: "25" },
        { label: "≤ 50 units", value: "50" },
        { label: "≤ 100 units", value: "100" },
      ],
      placeholder: "Stock Threshold",
    },
  ];

  const actions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        className="flex items-center gap-2"
      >
        <IconDownload className="h-4 w-4" />
        Export
      </Button>
    </div>
  );

  const renderCell = (item: LowStockProduct, column: string) => {
    switch (column) {
      case "name":
        return (
          <div className="font-medium">
            <div className="text-sm font-semibold">{item.name}</div>
            <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
          </div>
        );
      case "stock":
        return (
          <div className="text-center">
            <div className="font-semibold text-lg">{item.stock}</div>
            <div className="text-xs text-muted-foreground">units</div>
          </div>
        );
      case "min_stock":
        return (
          <div className="text-center">
            <div className="font-medium">{item.min_stock}</div>
            <div className="text-xs text-muted-foreground">min required</div>
          </div>
        );
      case "status":
        return getStockLevelBadge(item.stock, item.min_stock);
      case "category":
        return item.category?.name || "-";
      case "brand":
        return item.brand?.name || "-";
      case "supplier":
        return item.supplier?.name || "-";
      case "value":
        return (
          <div className="text-right">
            <div className="font-medium">
              {formatCurrency(item.cost * item.stock)}
            </div>
            <div className="text-xs text-muted-foreground">current value</div>
          </div>
        );
      case "price":
        return (
          <div className="text-right">
            <div className="font-medium">{formatCurrency(item.price)}</div>
            <div className="text-xs text-muted-foreground">selling price</div>
          </div>
        );
      default:
        return null;
    }
  };

  const columns = [
    { key: "name", label: "Product" },
    { key: "stock", label: "Current Stock" },
    { key: "min_stock", label: "Min Stock" },
    { key: "status", label: "Status" },
    { key: "category", label: "Category" },
    { key: "brand", label: "Brand" },
    { key: "supplier", label: "Supplier" },
    { key: "value", label: "Current Value" },
    { key: "price", label: "Price" },
  ];

  const quickFilters = [
    {
      label: "Critical Stock",
      count: metrics.criticalStock,
      active: filters.threshold === "0",
      onClick: () =>
        handleFilterChange("threshold", filters.threshold === "0" ? "" : "0"),
      icon: AlertTriangle,
      variant: "destructive" as const,
    },
    {
      label: "Low Stock",
      count: metrics.lowStock,
      active: !filters.threshold,
      onClick: () => handleResetFilters(),
      icon: Package,
      variant: "secondary" as const,
    },
  ];

  return (
    <InventoryPageLayout
      // Header
      title="Low Stock Alerts"
      description="Monitor products that are running low on stock and need reordering"
      actions={actions}
      // Filters
      searchPlaceholder="Search products by name or SKU..."
      searchValue={filters.search}
      onSearchChange={(value) => handleFilterChange("search", value)}
      filters={filterConfigs}
      filterValues={filters}
      onFilterChange={handleFilterChange}
      onResetFilters={handleResetFilters}
      quickFilters={quickFilters}
      // Sort
      sortOptions={SORT_OPTIONS}
      currentSort={
        filters.sortBy.includes("-")
          ? filters.sortBy
          : `${filters.sortBy}-${filters.sortOrder}`
      }
      onSortChange={handleSortChange}
      // Table
      tableTitle="Low Stock Products"
      totalCount={pagination.totalItems}
      currentCount={filteredProducts.length}
      showingText={`Showing ${filteredProducts.length} of ${pagination.totalItems} low stock products`}
      columns={columns}
      visibleColumns={columns.map((col) => col.key)}
      data={filteredProducts}
      renderCell={renderCell}
      // Pagination
      pagination={pagination}
      onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
      onPageSizeChange={(limit) =>
        setPagination((prev) => ({ ...prev, limit, page: 1 }))
      }
      // Loading states
      isLoading={loading}
      error={error}
      onRetry={fetchLowStockProducts}
      // Empty state
      emptyStateIcon={IconPackages}
      emptyStateMessage="No low stock products found"
    />
  );
}
