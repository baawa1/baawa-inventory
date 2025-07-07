"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { toast } from "sonner";

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
}

export function InventoryReports() {
  const [reportType, setReportType] = useState<string>("current_stock");
  const [filters, setFilters] = useState<ReportFilters>({});
  const [showFilters, setShowFilters] = useState(false);

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
  } = useQuery({
    queryKey: ["inventory-report", reportType, filters],
    queryFn: async (): Promise<ReportData> => {
      const params = new URLSearchParams({
        type: reportType,
        format: "json",
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
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case "current_stock":
        return <Package className="h-4 w-4" />;
      case "stock_value":
        return <BarChart3 className="h-4 w-4" />;
      case "low_stock":
        return <AlertTriangle className="h-4 w-4" />;
      case "product_summary":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

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
                  id="low-stock-only"
                  checked={filters.lowStockOnly || false}
                  onCheckedChange={(checked) =>
                    handleFilterChange("lowStockOnly", checked)
                  }
                />
                <Label htmlFor="low-stock-only">Low stock only</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include-archived"
                  checked={filters.includeArchived || false}
                  onCheckedChange={(checked) =>
                    handleFilterChange("includeArchived", checked)
                  }
                />
                <Label htmlFor="include-archived">Include archived</Label>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: "current_stock",
            label: "Current Stock",
            description: "Complete inventory status",
          },
          {
            id: "stock_value",
            label: "Stock Value",
            description: "Inventory valuation report",
          },
          {
            id: "low_stock",
            label: "Low Stock",
            description: "Items needing restock",
          },
          {
            id: "product_summary",
            label: "Product Summary",
            description: "Product distribution analysis",
          },
        ].map((report) => (
          <Card
            key={report.id}
            className={`cursor-pointer transition-colors ${
              reportType === report.id
                ? "border-primary"
                : "hover:border-border"
            }`}
            onClick={() => setReportType(report.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {getReportIcon(report.id)}
                <h3 className="font-semibold">{report.label}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {report.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getReportIcon(reportType)}
              {reportData?.title || "Generate Report"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCSV}
                disabled={isLoading || !reportData}
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </div>
          {reportData && (
            <p className="text-sm text-muted-foreground">
              Generated on {new Date(reportData.generatedAt).toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : reportData ? (
            <ReportDisplay reportType={reportType} data={reportData.data} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Select a report type to generate
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReportDisplay({
  reportType,
  data,
}: {
  reportType: string;
  data: any;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  if (reportType === "current_stock") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900">Total Products</h4>
            <p className="text-2xl font-bold text-blue-600">{data.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900">Total Stock Value</h4>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                data.reduce(
                  (sum: number, item: any) => sum + item.stockValue,
                  0
                )
              )}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-900">Low Stock Items</h4>
            <p className="text-2xl font-bold text-red-600">
              {data.filter((item: any) => item.isLowStock).length}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left">
                  Product
                </th>
                <th className="border border-gray-300 p-2 text-left">SKU</th>
                <th className="border border-gray-300 p-2 text-left">
                  Category
                </th>
                <th className="border border-gray-300 p-2 text-right">Stock</th>
                <th className="border border-gray-300 p-2 text-right">
                  Min Stock
                </th>
                <th className="border border-gray-300 p-2 text-right">Value</th>
                <th className="border border-gray-300 p-2 text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2">{item.name}</td>
                  <td className="border border-gray-300 p-2">{item.sku}</td>
                  <td className="border border-gray-300 p-2">
                    {item.category}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {item.currentStock}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {item.minStock}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatCurrency(item.stockValue)}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {item.isLowStock ? (
                      <Badge variant="destructive">Low Stock</Badge>
                    ) : (
                      <Badge variant="default">In Stock</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (reportType === "stock_value") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900">Total Products</h4>
            <p className="text-2xl font-bold text-blue-600">
              {data.summary.totalProducts}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900">Stock Value</h4>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.totalStockValue)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900">Selling Value</h4>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(data.summary.totalSellingValue)}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-900">Potential Profit</h4>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(data.summary.potentialProfit)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left">
                  Product
                </th>
                <th className="border border-gray-300 p-2 text-left">SKU</th>
                <th className="border border-gray-300 p-2 text-right">Stock</th>
                <th className="border border-gray-300 p-2 text-right">
                  Cost Price
                </th>
                <th className="border border-gray-300 p-2 text-right">
                  Selling Price
                </th>
                <th className="border border-gray-300 p-2 text-right">
                  Stock Value
                </th>
                <th className="border border-gray-300 p-2 text-right">
                  Profit Margin
                </th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2">{item.name}</td>
                  <td className="border border-gray-300 p-2">{item.sku}</td>
                  <td className="border border-gray-300 p-2 text-right">
                    {item.currentStock}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatCurrency(item.costPrice)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatCurrency(item.sellingPrice)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatCurrency(item.stockValue)}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {item.profitMargin.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (reportType === "low_stock") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-900">Low Stock Items</h4>
            <p className="text-2xl font-bold text-red-600">{data.length}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-900">Out of Stock</h4>
            <p className="text-2xl font-bold text-orange-600">
              {data.filter((item: any) => item.currentStock <= 0).length}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900">Total Reorder Value</h4>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(
                data.reduce(
                  (sum: number, item: any) => sum + item.reorderValue,
                  0
                )
              )}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left">
                  Product
                </th>
                <th className="border border-gray-300 p-2 text-left">SKU</th>
                <th className="border border-gray-300 p-2 text-right">
                  Current Stock
                </th>
                <th className="border border-gray-300 p-2 text-right">
                  Min Stock
                </th>
                <th className="border border-gray-300 p-2 text-right">
                  Reorder Qty
                </th>
                <th className="border border-gray-300 p-2 text-right">
                  Reorder Value
                </th>
                <th className="border border-gray-300 p-2 text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2">{item.name}</td>
                  <td className="border border-gray-300 p-2">{item.sku}</td>
                  <td className="border border-gray-300 p-2 text-right">
                    {item.currentStock}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {item.minStock}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {item.reorderQuantity}
                  </td>
                  <td className="border border-gray-300 p-2 text-right">
                    {formatCurrency(item.reorderValue)}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <Badge
                      variant={
                        item.currentStock <= 0 ? "destructive" : "secondary"
                      }
                    >
                      {item.daysOutOfStock}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (reportType === "product_summary") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900">Total Products</h4>
            <p className="text-2xl font-bold text-blue-600">
              {data.totalProducts}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900">Categories</h4>
            <p className="text-2xl font-bold text-green-600">
              {data.byCategory.length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900">Brands</h4>
            <p className="text-2xl font-bold text-purple-600">
              {data.byBrand.length}
            </p>
          </div>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="brands">By Brand</TabsTrigger>
            <TabsTrigger value="suppliers">By Supplier</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">
                      Category
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Product Count
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Total Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCategory.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">
                        {item.category}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {item.productCount}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {item.totalStock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="brands">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">
                      Brand
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Product Count
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Total Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.byBrand.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">
                        {item.brand}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {item.productCount}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {item.totalStock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="suppliers">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">
                      Supplier
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Product Count
                    </th>
                    <th className="border border-gray-300 p-2 text-right">
                      Total Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.bySupplier.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">
                        {item.supplier}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {item.productCount}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {item.totalStock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">Report type not supported</p>
    </div>
  );
}
