"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  IconTrendingUp,
  IconTrendingDown,
  IconPackages,
  IconCurrencyNaira,
  IconShoppingCart,
  IconEye,
  IconChartPie,
  IconTag,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface CategoryPerformance {
  id: number;
  name: string;
  productCount: number;
  totalSold: number;
  revenue: number;
  averageOrderValue: number;
  marketShare: number;
  trending: "up" | "down" | "stable";
  trendPercentage: number;
  topProduct: {
    name: string;
    revenue: number;
  } | null;
}

interface CategoryAnalyticsProps {
  user: {
    id: string;
    role: string;
  };
}

async function fetchCategoryPerformance(
  period: string
): Promise<CategoryPerformance[]> {
  const response = await fetch(
    `/api/pos/analytics/categories?period=${period}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch category performance");
  }
  return response.json();
}

export function CategoryAnalytics({ user: _user }: CategoryAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["category-performance", selectedPeriod],
    queryFn: () => fetchCategoryPerformance(selectedPeriod),
  });

  if (error) {
    toast.error("Failed to load category performance data");
  }

  const periods = [
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
    { value: "1y", label: "Last Year" },
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
  const totalRevenue = categories.reduce(
    (sum, category) => sum + category.revenue,
    0
  );
  const totalUnitsSold = categories.reduce(
    (sum, category) => sum + category.totalSold,
    0
  );
  const totalProducts = categories.reduce(
    (sum, category) => sum + category.productCount,
    0
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Category Performance</h1>
          <p className="text-muted-foreground">
            Compare sales performance across product categories
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
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
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : categories.length > 0 ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <IconCurrencyNaira className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {categories.length} categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Units Sold
                </CardTitle>
                <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalUnitsSold.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total units moved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
                <IconPackages className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  In all categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Categories
                </CardTitle>
                <IconTag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active categories
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Market Share Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Market Share by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories
                  .sort((a, b) => b.marketShare - a.marketShare)
                  .map((category) => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <IconChartPie className="h-4 w-4 text-primary" />
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="outline">
                            {category.productCount} products
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(category.revenue)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {category.marketShare.toFixed(1)}% of total sales
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${category.marketShare}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Market Share</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                    <TableHead>Top Product</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <IconTag className="h-4 w-4 text-primary" />
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {category.productCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {category.totalSold}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(category.revenue)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{category.marketShare.toFixed(1)}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-1">
                              <div
                                className="bg-primary h-1 rounded-full"
                                style={{ width: `${category.marketShare}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(category.averageOrderValue)}
                        </TableCell>
                        <TableCell>
                          {category.topProduct ? (
                            <div>
                              <div className="font-medium text-sm">
                                {category.topProduct.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(category.topProduct.revenue)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getTrendBadge(
                            category.trending,
                            category.trendPercentage
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <IconEye className="w-4 h-4 mr-1" />
                            View Products
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Performing Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5)
                    .map((category, index) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(category.revenue)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {category.totalSold} units
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Active Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories
                    .sort((a, b) => b.totalSold - a.totalSold)
                    .slice(0, 5)
                    .map((category, index) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {category.totalSold} units
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(category.revenue)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No category data available for the selected period.
        </div>
      )}
    </div>
  );
}
