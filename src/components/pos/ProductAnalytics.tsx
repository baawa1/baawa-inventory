"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  IconSearch,
  IconTrendingUp,
  IconTrendingDown,
  IconPackages,
  IconCurrencyNaira,
  IconShoppingCart,
  IconEye,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface ProductPerformance {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  brand: string | null;
  currentStock: number;
  totalSold: number;
  revenue: number;
  averageOrderValue: number;
  lastSold: string | null;
  trending: "up" | "down" | "stable";
  trendPercentage: number;
}

interface ProductAnalyticsProps {
  user: {
    id: string;
    role: string;
  };
}

async function fetchProductPerformance(
  period: string,
  search: string,
  category: string,
  sortBy: string
): Promise<ProductPerformance[]> {
  const params = new URLSearchParams({
    period,
    search,
    category,
    sortBy,
  });

  const response = await fetch(`/api/pos/analytics/products?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch product performance");
  }
  return response.json();
}

async function fetchCategories(): Promise<{ id: number; name: string }[]> {
  const response = await fetch("/api/inventory/categories");
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
}

export function ProductAnalytics({ user: _ }: ProductAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("revenue");

  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "product-performance",
      selectedPeriod,
      searchTerm,
      selectedCategory,
      sortBy,
    ],
    queryFn: () =>
      fetchProductPerformance(
        selectedPeriod,
        searchTerm,
        selectedCategory,
        sortBy
      ),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-list"],
    queryFn: fetchCategories,
  });

  if (error) {
    toast.error("Failed to load product performance data");
  }

  const periods = [
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
    { value: "1y", label: "Last Year" },
  ];

  const sortOptions = [
    { value: "revenue", label: "Revenue" },
    { value: "totalSold", label: "Units Sold" },
    { value: "averageOrderValue", label: "Avg Order Value" },
    { value: "name", label: "Product Name" },
  ];

  const getTrendBadge = (trending: string, percentage: number) => {
    if (trending === "up") {
      return (
        <Badge className="bg-green-100 text-green-800">
          <IconTrendingUp className="w-3 h-3 mr-1" />+{percentage}%
        </Badge>
      );
    } else if (trending === "down") {
      return (
        <Badge className="bg-red-100 text-red-800">
          <IconTrendingDown className="w-3 h-3 mr-1" />-{percentage}%
        </Badge>
      );
    }
    return <Badge variant="outline">Stable</Badge>;
  };

  // Calculate summary stats
  const totalRevenue = products.reduce(
    (sum, product) => sum + product.revenue,
    0
  );
  const totalUnitsSold = products.reduce(
    (sum, product) => sum + product.totalSold,
    0
  );
  const averageRevenue =
    products.length > 0 ? totalRevenue / products.length : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Performance</h1>
          <p className="text-muted-foreground">
            Analyze sales performance for individual products
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IconCurrencyNaira className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {products.length} products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
            <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUnitsSold.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total units moved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Revenue
            </CardTitle>
            <IconPackages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Per product</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Product Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Performance Data</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category/Brand</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Units Sold</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Avg Order Value</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Last Sold</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.sku}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {product.category && (
                          <Badge variant="outline">{product.category}</Badge>
                        )}
                        {product.brand && (
                          <div className="text-sm text-muted-foreground">
                            {product.brand}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.currentStock > 10 ? "default" : "destructive"
                        }
                      >
                        {product.currentStock}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.totalSold}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(product.revenue)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.averageOrderValue)}
                    </TableCell>
                    <TableCell>
                      {getTrendBadge(product.trending, product.trendPercentage)}
                    </TableCell>
                    <TableCell>
                      {product.lastSold ? (
                        new Date(product.lastSold).toLocaleDateString()
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <IconEye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {products.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No products found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
