'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconDownload,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface ProductPerformanceProps {
  user: User;
}

interface ProductPerformanceData {
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

interface ProductAnalyticsResponse {
  products: ProductPerformanceData[];
  summary: {
    totalProducts: number;
    totalSold: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
}

async function fetchProductAnalytics(
  period: string,
  fromDate?: string,
  toDate?: string,
  search?: string,
  category?: string,
  page?: number,
  limit?: number
): Promise<ProductAnalyticsResponse> {
  const params = new URLSearchParams();
  params.append('period', period);

  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (search) params.append('search', search);
  if (category && category !== 'all') params.append('category', category);
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());

  const response = await fetch(`/api/pos/analytics/products?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product analytics');
  }
  const result = await response.json();
  return result.data;
}

export function ProductPerformance({ user: _ }: ProductPerformanceProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(), // Today
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });

  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'product-analytics',
      dateRange?.from,
      dateRange?.to,
      pagination.page,
      pagination.limit,
    ],
    queryFn: () =>
      fetchProductAnalytics(
        'custom',
        dateRange?.from?.toISOString().split('T')[0],
        dateRange?.to?.toISOString().split('T')[0],
        undefined,
        undefined,
        pagination.page,
        pagination.limit
      ),
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  if (error) {
    toast.error('Failed to load product analytics data');
  }

  const products = useMemo(
    () => analyticsData?.products || [],
    [analyticsData?.products]
  );

  const summaryStats = useMemo(() => {
    if (!analyticsData?.summary) {
      return {
        totalProducts: 0,
        totalSold: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      };
    }

    return analyticsData.summary;
  }, [analyticsData?.summary]);

  // Update pagination state from API response
  useEffect(() => {
    if (analyticsData?.pagination) {
      setPagination(prev => ({
        ...prev,
        totalPages: analyticsData.pagination.totalPages,
        totalItems: analyticsData.pagination.total,
      }));
    }
  }, [analyticsData?.pagination]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getTrendBadge = (trending: string, trendPercentage: number) => {
    if (trending === 'up') {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <IconTrendingUp className="mr-1 h-3 w-3" />+
          {trendPercentage.toFixed(0)}%
        </Badge>
      );
    } else if (trending === 'down') {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <IconTrendingDown className="mr-1 h-3 w-3" />
          {Math.abs(trendPercentage).toFixed(0)}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <IconMinus className="mr-1 h-3 w-3" />
          0%
        </Badge>
      );
    }
  };

  const handleDownload = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append('fromDate', dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange?.to) {
        params.append('toDate', dateRange.to.toISOString().split('T')[0]);
      }
      params.append('format', 'csv');

      const response = await fetch(
        `/api/pos/analytics/products/export?${params}`
      );
      if (!response.ok) throw new Error('Failed to download');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `product-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export downloaded successfully');
    } catch (_error) {
      toast.error('Failed to download export');
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Performance</h1>
          <p className="text-muted-foreground">
            Analyze sales performance for individual products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Select date range"
            className="w-[300px]"
          />
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <IconDownload className="mr-1 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.totalProducts}
            </div>
            <p className="text-muted-foreground text-xs">
              Across {products.length} products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalSold}</div>
            <p className="text-muted-foreground text-xs">Total units moved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.totalRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Sales Data</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Loading product data...
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Items Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(product => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name || 'Unknown Product'}
                      </TableCell>
                      <TableCell>{product.sku || 'N/A'}</TableCell>
                      <TableCell>
                        {product.category || 'Uncategorized'}
                      </TableCell>
                      <TableCell>{product.totalSold || 0}</TableCell>
                      <TableCell>
                        {formatCurrency(product.revenue || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            (product.currentStock || 0) > 0
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {product.currentStock || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getTrendBadge(
                          product.trending || 'stable',
                          product.trendPercentage || 0
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-muted-foreground mt-4 text-sm">
                {products.length} Products • {summaryStats?.totalSold || 0}{' '}
                Items sold • {formatCurrency(summaryStats?.totalRevenue || 0)}{' '}
                Total revenue
              </div>

              {/* Pagination - Moved to far right */}
              {pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-end">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            handlePageChange(Math.max(1, pagination.page - 1))
                          }
                          className={
                            pagination.page === 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                      {pagination.page > 2 && (
                        <>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => handlePageChange(1)}
                              className="cursor-pointer"
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {pagination.page > 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}
                      {pagination.page > 1 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() =>
                              handlePageChange(pagination.page - 1)
                            }
                            className="cursor-pointer"
                          >
                            {pagination.page - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink isActive className="cursor-pointer">
                          {pagination.page}
                        </PaginationLink>
                      </PaginationItem>
                      {pagination.page < pagination.totalPages && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() =>
                              handlePageChange(pagination.page + 1)
                            }
                            className="cursor-pointer"
                          >
                            {pagination.page + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      {pagination.page < pagination.totalPages - 1 && (
                        <>
                          {pagination.page < pagination.totalPages - 2 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() =>
                                handlePageChange(pagination.totalPages)
                              }
                              className="cursor-pointer"
                            >
                              {pagination.totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            handlePageChange(
                              Math.min(
                                pagination.totalPages,
                                pagination.page + 1
                              )
                            )
                          }
                          className={
                            pagination.page === pagination.totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
