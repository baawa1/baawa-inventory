'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconSearch,
  IconTrendingUp,
  IconTrendingDown,
  IconPackages,
  IconCurrencyNaira,
  IconShoppingCart,
  IconEye,
  IconTrophy,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

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
  trending: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface ProductAnalyticsProps {
  user: {
    id: string;
    role: string;
  };
}

async function fetchProductPerformance(
  dateRange: DateRange | undefined,
  search: string,
  category: string,
  sortBy: string
): Promise<ProductPerformance[]> {
  const params = new URLSearchParams({
    search,
    category,
    sortBy,
  });

  if (dateRange?.from) {
    params.append('fromDate', dateRange.from.toISOString().split('T')[0]);
  }
  if (dateRange?.to) {
    params.append('toDate', dateRange.to.toISOString().split('T')[0]);
  }

  const response = await fetch(`/api/pos/analytics/products?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product performance');
  }
  const result = await response.json();
  console.log('API Response:', result);
  console.log('Products from API:', result.data?.products);
  return result.data.products;
}

async function fetchCategories(): Promise<{ id: number; name: string }[]> {
  const response = await fetch('/api/inventory/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
}

export function ProductAnalytics({ user: _ }: ProductAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(), // Today
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('revenue');

  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'product-performance',
      dateRange?.from,
      dateRange?.to,
      searchTerm,
      selectedCategory,
      sortBy,
    ],
    queryFn: () =>
      fetchProductPerformance(dateRange, searchTerm, selectedCategory, sortBy),
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  // Debug logging
  console.log('Products data:', products);
  console.log('Products length:', products?.length);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-list'],
    queryFn: fetchCategories,
  });

  if (error) {
    toast.error('Failed to load product performance data');
  }

  const sortOptions = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'totalSold', label: 'Units Sold' },
    { value: 'averageOrderValue', label: 'Avg Order Value' },
    { value: 'name', label: 'Product Name' },
    { value: 'currentStock', label: 'Current Stock' },
    { value: 'lastSold', label: 'Last Sold Date' },
  ];

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

  // Find top performer by revenue
  const topProduct =
    products.length > 0
      ? products.reduce((top, current) =>
          current.revenue > top.revenue ? current : top
        )
      : null;

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Performance</h1>
          <p className="text-muted-foreground">
            Analyze sales performance for individual products
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IconCurrencyNaira className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-muted-foreground text-xs">
              Across {products.length} products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
            <IconShoppingCart className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUnitsSold.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">Total units moved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Revenue
            </CardTitle>
            <IconPackages className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageRevenue)}
            </div>
            <p className="text-muted-foreground text-xs">Per product</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <IconTrophy className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="truncate text-lg font-bold">
              {topProduct?.name || 'N/A'}
            </div>
            <p className="text-muted-foreground text-xs">
              {formatCurrency(topProduct?.revenue || 0)} revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="relative">
              <IconSearch className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              placeholder="Select date range"
              className="w-[300px]"
            />

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
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
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
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
                {products.map(product => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-muted-foreground text-sm">
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
                          <div className="text-muted-foreground text-sm">
                            {product.brand}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.currentStock > 10 ? 'default' : 'destructive'
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
                        <IconEye className="mr-1 h-4 w-4" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {products.length === 0 && !isLoading && (
            <div className="text-muted-foreground py-8 text-center">
              No products found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
