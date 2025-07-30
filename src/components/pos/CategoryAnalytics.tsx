'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  IconTrendingUp,
  IconTrendingDown,
  IconPackages,
  IconCurrencyNaira,
  IconShoppingCart,
  IconEye,
  IconChartPie,
  IconTag,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

interface CategoryPerformance {
  id: number;
  name: string;
  productCount: number;
  totalSold: number;
  revenue: number;
  averageOrderValue: number;
  marketShare: number;
  trending: 'up' | 'down' | 'stable';
  trendPercentage: number;
  topProducts: Array<{
    id: number;
    name: string;
    revenue: number;
  }>;
}

interface CategoryAnalyticsProps {
  user: {
    id: string;
    role: string;
  };
}

async function fetchCategoryPerformance(
  dateRange: DateRange | undefined
): Promise<CategoryPerformance[]> {
  const params = new URLSearchParams();

  if (dateRange?.from) {
    params.append('fromDate', dateRange.from.toISOString().split('T')[0]);
  }
  if (dateRange?.to) {
    params.append('toDate', dateRange.to.toISOString().split('T')[0]);
  }

  const response = await fetch(`/api/pos/analytics/categories?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch category performance');
  }
  const result = await response.json();
  return result.data || [];
}

export function CategoryAnalytics({ user: _ }: CategoryAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(), // Today
  });

  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['category-performance', dateRange?.from, dateRange?.to],
    queryFn: () => fetchCategoryPerformance(dateRange),
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  if (error) {
    toast.error('Failed to load category performance data');
  }

  const getTrendBadge = (trending: string, percentage: number) => {
    if (trending === 'up') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <IconTrendingUp className="mr-1 h-3 w-3" />+{percentage}%
        </Badge>
      );
    } else if (trending === 'down') {
      return (
        <Badge className="bg-red-100 text-red-800">
          <IconTrendingDown className="mr-1 h-3 w-3" />-{percentage}%
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
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Category Performance</h1>
          <p className="text-muted-foreground">
            Compare sales performance across product categories
          </p>
        </div>
        <div className="flex gap-2">
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Select date range"
            className="w-[300px]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      ) : categories.length > 0 ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <IconCurrencyNaira className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-muted-foreground text-xs">
                  Across {categories.length} categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Units Sold
                </CardTitle>
                <IconShoppingCart className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalUnitsSold.toLocaleString()}
                </div>
                <p className="text-muted-foreground text-xs">
                  Total units moved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
                <IconPackages className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-muted-foreground text-xs">
                  In all categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Categories
                </CardTitle>
                <IconTag className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categories.length}</div>
                <p className="text-muted-foreground text-xs">
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
                  .map(category => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <IconChartPie className="text-primary h-4 w-4" />
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="outline">
                            {category.productCount} products
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(category.revenue)}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {category.marketShare.toFixed(1)}% of total sales
                          </div>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
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
                    .map(category => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <IconTag className="text-primary h-4 w-4" />
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
                            <div className="h-1 w-16 rounded-full bg-gray-200">
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
                          {category.topProducts &&
                          category.topProducts.length > 0 ? (
                            <div>
                              <div className="text-sm font-medium">
                                {category.topProducts[0].name}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {formatCurrency(
                                  category.topProducts[0].revenue
                                )}
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
                            <IconEye className="mr-1 h-4 w-4" />
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                          <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(category.revenue)}
                          </div>
                          <div className="text-muted-foreground text-xs">
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
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {category.totalSold} units
                          </div>
                          <div className="text-muted-foreground text-xs">
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
        <div className="text-muted-foreground py-12 text-center">
          No category data available for the selected period.
        </div>
      )}
    </div>
  );
}
