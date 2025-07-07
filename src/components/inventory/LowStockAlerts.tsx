"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Package, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

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

const fetchLowStockProducts = async (): Promise<LowStockResponse> => {
  const response = await fetch("/api/products/low-stock");
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

  const {
    data: response,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["low-stock-products"],
    queryFn: fetchLowStockProducts,
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

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    refetch();
    toast.success("Low stock data refreshed");
  };

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
    <div className="space-y-6">
      {/* Summary Cards */}
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
                {metrics.criticalStock}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Products requiring immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold text-orange-600">
                {metrics.lowStock}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Products below minimum threshold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(metrics.totalValue)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total value of low stock items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>
                Monitor and manage products with low stock levels
              </CardDescription>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefetching}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <div className="relative flex-1">
                <Label htmlFor="search" className="sr-only">
                  Search products
                </Label>
                <Input
                  id="search"
                  placeholder="Search by product name, SKU, category, or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>

            {/* Products Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading products...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm
                            ? "No products found matching your search"
                            : "No low stock products found"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStockStatusIcon(
                              product.stock,
                              product.min_stock
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                SKU: {product.sku}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{product.category?.name || "N/A"}</TableCell>
                        <TableCell>{product.brand?.name || "N/A"}</TableCell>
                        <TableCell className="text-center font-medium">
                          {product.stock}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.min_stock}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStockStatusColor(
                              product.stock,
                              product.min_stock
                            )}
                          >
                            {getStockStatusText(
                              product.stock,
                              product.min_stock
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(product.cost)}</TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>{product.supplier?.name || "N/A"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
