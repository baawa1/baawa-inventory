"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Download,
  Filter,
  RefreshCw,
  FileText,
  BarChart3,
  AlertTriangle,
  Package,
  Loader2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardTable } from "@/components/layouts/DashboardTable";

interface ReportFilters {
  category?: string;
  brand?: string;
  supplier?: string;
  lowStockOnly?: boolean;
  includeArchived?: boolean;
}

interface ReportData {
  title: string;
  generatedAt: string;
  data: any;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
}

export function InventoryReports() {
  const searchParams = useSearchParams();
  const urlReportType = searchParams.get("type");

  const [reportType, setReportType] = useState<string>(() => {
    // Set initial state based on URL parameter
    if (
      urlReportType &&
      ["current_stock", "stock_value", "low_stock", "product_summary"].includes(
        urlReportType
      )
    ) {
      return urlReportType;
    }
    return "current_stock";
  });
  const [filters, setFilters] = useState<ReportFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  // Fetch categories, brands, and suppliers for filters
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await fetch("/api/brands");
      if (!response.ok) throw new Error("Failed to fetch brands");
      return response.json();
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers");
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      return response.json();
    },
  });

  // Generate report
  const {
    data: reportData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      "inventory-report",
      reportType,
      filters,
      pagination.page,
      pagination.limit,
    ],
    queryFn: async (): Promise<ReportData> => {
      const params = new URLSearchParams({
        type: reportType,
        format: "json",
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.category && { category: filters.category }),
        ...(filters.brand && { brand: filters.brand }),
        ...(filters.supplier && { supplier: filters.supplier }),
        ...(filters.lowStockOnly && { lowStockOnly: "true" }),
        ...(filters.includeArchived && { includeArchived: "true" }),
      });

      const response = await fetch(`/api/reports/inventory?${params}`);
      if (!response.ok) throw new Error("Failed to generate report");
      return response.json();
    },
  });

  const handleDownloadCSV = async () => {
    try {
      const params = new URLSearchParams({
        type: reportType,
        format: "csv",
        ...(filters.category && { category: filters.category }),
        ...(filters.brand && { brand: filters.brand }),
        ...(filters.supplier && { supplier: filters.supplier }),
        ...(filters.lowStockOnly && { lowStockOnly: "true" }),
        ...(filters.includeArchived && { includeArchived: "true" }),
      });

      const response = await fetch(`/api/reports/inventory?${params}`);
      if (!response.ok) throw new Error("Failed to download report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `inventory-report-${reportType}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Report downloaded successfully");
    } catch (_error) {
      toast.error("Failed to download report");
    }
  };

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters((prev) => {
      if (prev[key] === value) return prev; // Prevent unnecessary updates
      return { ...prev, [key]: value };
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPagination((prev) => ({ ...prev, limit: newSize, page: 1 }));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  // Get table data and columns based on report type
  const { tableData, tableColumns, summaryCards } = useMemo(() => {
    if (!reportData?.data) {
      return { tableData: [], tableColumns: [], summaryCards: [] };
    }

    switch (reportType) {
      case "current_stock":
        return {
          tableData: reportData.data.products || reportData.data || [],
          tableColumns: [
            {
              key: "name",
              label: "Product",
              sortable: true,
              defaultVisible: true,
              required: true,
            },
            {
              key: "sku",
              label: "SKU",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "category",
              label: "Category",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "currentStock",
              label: "Stock",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "minStock",
              label: "Min Stock",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "stockValue",
              label: "Value",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "status",
              label: "Status",
              sortable: false,
              defaultVisible: true,
            },
          ],
          summaryCards: [
            {
              title: "Total Products",
              value: reportData.data.length || 0,
              icon: Package,
              color: "blue",
            },
            {
              title: "Total Stock Value",
              value: formatCurrency(
                (reportData.data.products || reportData.data).reduce(
                  (sum: number, item: any) => sum + (item.stockValue || 0),
                  0
                )
              ),
              icon: DollarSign,
              color: "green",
            },
            {
              title: "Low Stock Items",
              value: (reportData.data.products || reportData.data).filter(
                (item: any) => item.isLowStock
              ).length,
              icon: AlertTriangle,
              color: "red",
            },
          ],
        };

      case "stock_value":
        return {
          tableData: reportData.data.products || [],
          tableColumns: [
            {
              key: "name",
              label: "Product",
              sortable: true,
              defaultVisible: true,
              required: true,
            },
            {
              key: "sku",
              label: "SKU",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "currentStock",
              label: "Stock",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "costPrice",
              label: "Cost Price",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "sellingPrice",
              label: "Selling Price",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "stockValue",
              label: "Stock Value",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "profitMargin",
              label: "Profit Margin",
              sortable: true,
              defaultVisible: true,
            },
          ],
          summaryCards: [
            {
              title: "Total Products",
              value: reportData.data.summary?.totalProducts || 0,
              icon: Package,
              color: "blue",
            },
            {
              title: "Stock Value",
              value: formatCurrency(
                reportData.data.summary?.totalStockValue || 0
              ),
              icon: DollarSign,
              color: "green",
            },
            {
              title: "Selling Value",
              value: formatCurrency(
                reportData.data.summary?.totalSellingValue || 0
              ),
              icon: ShoppingCart,
              color: "purple",
            },
            {
              title: "Potential Profit",
              value: formatCurrency(
                reportData.data.summary?.potentialProfit || 0
              ),
              icon: TrendingUp,
              color: "orange",
            },
          ],
        };

      case "low_stock":
        return {
          tableData: reportData.data || [],
          tableColumns: [
            {
              key: "name",
              label: "Product",
              sortable: true,
              defaultVisible: true,
              required: true,
            },
            {
              key: "sku",
              label: "SKU",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "currentStock",
              label: "Current Stock",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "minStock",
              label: "Min Stock",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "reorderQuantity",
              label: "Reorder Qty",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "reorderValue",
              label: "Reorder Value",
              sortable: true,
              defaultVisible: true,
            },
            {
              key: "status",
              label: "Status",
              sortable: false,
              defaultVisible: true,
            },
          ],
          summaryCards: [
            {
              title: "Low Stock Items",
              value: reportData.data.length || 0,
              icon: AlertTriangle,
              color: "red",
            },
            {
              title: "Out of Stock",
              value: reportData.data.filter(
                (item: any) => item.currentStock <= 0
              ).length,
              icon: Package,
              color: "orange",
            },
            {
              title: "Total Reorder Value",
              value: formatCurrency(
                reportData.data.reduce(
                  (sum: number, item: any) => sum + (item.reorderValue || 0),
                  0
                )
              ),
              icon: DollarSign,
              color: "blue",
            },
          ],
        };

      default:
        return { tableData: [], tableColumns: [], summaryCards: [] };
    }
  }, [reportData, reportType]);

  // Update pagination from API response
  const currentPagination = {
    page: reportData?.pagination?.page || pagination.page,
    limit: reportData?.pagination?.limit || pagination.limit,
    totalPages: reportData?.pagination?.totalPages || pagination.totalPages,
    totalItems: reportData?.pagination?.total || tableData.length,
  };

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              {item.description && (
                <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {item.description}
                </div>
              )}
            </div>
          </div>
        );
      case "sku":
        return <span className="font-mono text-sm">{item.sku}</span>;
      case "category":
        return <span>{item.category}</span>;
      case "currentStock":
        return <span className="text-right">{item.currentStock}</span>;
      case "minStock":
        return <span className="text-right">{item.minStock}</span>;
      case "stockValue":
        return (
          <span className="text-right font-medium">
            {formatCurrency(item.stockValue)}
          </span>
        );
      case "costPrice":
        return (
          <span className="text-right">{formatCurrency(item.costPrice)}</span>
        );
      case "sellingPrice":
        return (
          <span className="text-right font-medium">
            {formatCurrency(item.sellingPrice)}
          </span>
        );
      case "profitMargin":
        return (
          <span className="text-right">
            <Badge variant={item.profitMargin > 0 ? "default" : "secondary"}>
              {item.profitMargin.toFixed(2)}%
            </Badge>
          </span>
        );
      case "reorderQuantity":
        return <span className="text-right">{item.reorderQuantity}</span>;
      case "reorderValue":
        return (
          <span className="text-right font-medium">
            {formatCurrency(item.reorderValue)}
          </span>
        );
      case "status":
        if (reportType === "current_stock") {
          return (
            <div className="text-center">
              {item.isLowStock ? (
                <Badge variant="destructive">Low Stock</Badge>
              ) : (
                <Badge variant="default">In Stock</Badge>
              )}
            </div>
          );
        } else if (reportType === "low_stock") {
          return (
            <div className="text-center">
              <Badge
                variant={item.currentStock <= 0 ? "destructive" : "secondary"}
              >
                {item.currentStock <= 0 ? "Out of Stock" : "Low Stock"}
              </Badge>
            </div>
          );
        }
        return null;
      default:
        return <span>{item[columnKey]}</span>;
    }
  };

  const defaultVisibleColumns = useMemo(
    () =>
      tableColumns.filter((col) => col.defaultVisible).map((col) => col.key),
    [tableColumns]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Reports</h2>
          <p className="text-muted-foreground">
            Generate and download comprehensive inventory reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={filters.category || ""}
                  onValueChange={(value) =>
                    handleFilterChange("category", value || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories?.map((category: any) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="brand">Brand</Label>
                <Select
                  value={filters.brand || ""}
                  onValueChange={(value) =>
                    handleFilterChange("brand", value || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All brands</SelectItem>
                    {brands?.map((brand: any) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={filters.supplier || ""}
                  onValueChange={(value) =>
                    handleFilterChange("supplier", value || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All suppliers</SelectItem>
                    {suppliers?.map((supplier: any) => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.id.toString()}
                      >
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="lowStockOnly"
                  checked={filters.lowStockOnly || false}
                  onCheckedChange={(checked) =>
                    handleFilterChange("lowStockOnly", checked)
                  }
                />
                <Label htmlFor="lowStockOnly">Low Stock Only</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="includeArchived"
                  checked={filters.includeArchived || false}
                  onCheckedChange={(checked) =>
                    handleFilterChange("includeArchived", checked)
                  }
                />
                <Label htmlFor="includeArchived">Include Archived</Label>
              </div>

              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const IconComponent = card.icon;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-900",
            green: "bg-green-50 text-green-900",
            red: "bg-red-50 text-red-900",
            purple: "bg-purple-50 text-purple-900",
            orange: "bg-orange-50 text-orange-900",
          };

          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    card.value
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger
            value="current_stock"
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Current Stock
          </TabsTrigger>
          <TabsTrigger value="stock_value" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Stock Value
          </TabsTrigger>
          <TabsTrigger value="low_stock" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Low Stock
          </TabsTrigger>
          <TabsTrigger
            value="product_summary"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value={reportType} className="mt-6">
          <DashboardTable
            tableTitle={`${reportType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} Report`}
            totalCount={currentPagination.totalItems}
            currentCount={tableData.length}
            columns={tableColumns}
            visibleColumns={defaultVisibleColumns}
            data={tableData}
            renderCell={renderCell}
            pagination={currentPagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={isLoading}
            isRefetching={isRefetching}
            emptyStateMessage="No data available for this report"
            emptyStateIcon={
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
