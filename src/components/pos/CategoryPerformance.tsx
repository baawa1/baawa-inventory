'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  IconCurrencyNaira,
  IconShoppingCart,
  IconPackages,
  IconTrophy,
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

interface CategoryPerformanceProps {
  user: User;
}

interface CategoryPerformanceData {
  id: number;
  name: string;
  totalSold: number;
  revenue: number;
  averageOrderValue: number;
  marketShare: number;
  trending: 'up' | 'down' | 'stable';
  trendPercentage: number;
  lastSaleDate: string | null;
  productCount: number;
  topProducts: Array<{
    id: number;
    name: string;
    revenue: number;
  }>;
}

interface CategoryAnalyticsResponse {
  categories: CategoryPerformanceData[];
  summary: {
    totalCategories: number;
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

async function fetchCategoryAnalytics(
  period: string,
  fromDate?: string,
  toDate?: string,
  search?: string,
  sortBy?: string,
  page?: number
): Promise<CategoryAnalyticsResponse> {
  const params = new URLSearchParams();
  params.append('period', period);

  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (search) params.append('search', search);
  if (sortBy) params.append('sortBy', sortBy);
  if (page) params.append('page', page.toString());

  const response = await fetch(`/api/pos/analytics/categories?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch category analytics');
  }
  const result = await response.json();

  // Return the API response directly since it now matches our interface
  return result.data;
}

export function CategoryPerformance({ user: _ }: CategoryPerformanceProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(), // Today
  });
  const [sortBy, setSortBy] = useState('revenue');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'category-analytics',
      dateRange?.from,
      dateRange?.to,
      sortBy,
      currentPage,
    ],
    queryFn: () =>
      fetchCategoryAnalytics(
        'custom',
        dateRange?.from?.toISOString().split('T')[0],
        dateRange?.to?.toISOString().split('T')[0],
        undefined,
        sortBy,
        currentPage
      ),
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  useEffect(() => {
    if (analyticsData?.pagination) {
      setTotalPages(analyticsData.pagination.totalPages);
    }
  }, [analyticsData?.pagination]);

  if (error) {
    toast.error('Failed to load category analytics data');
  }

  const categories = useMemo(
    () => analyticsData?.categories || [],
    [analyticsData?.categories]
  );

  const summaryStats = useMemo(() => {
    if (!analyticsData?.summary) {
      return {
        totalCategories: 0,
        totalSold: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      };
    }

    return analyticsData.summary;
  }, [analyticsData?.summary]);

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

  const sortOptions = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'totalSold', label: 'Units Sold' },
    { value: 'averageOrderValue', label: 'Avg Order Value' },
    { value: 'marketShare', label: 'Market Share' },
    { value: 'productCount', label: 'Products' },
    { value: 'name', label: 'Category Name' },
  ];

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Category Performance</h1>
          <p className="text-muted-foreground">
            Analyze category performance and sales metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Select date range"
            className="w-[300px]"
          />
          <div className="flex flex-col gap-1">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
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
              {formatCurrency(summaryStats.totalRevenue)}
            </div>
            <p className="text-muted-foreground text-xs">
              Across {summaryStats.totalCategories} categories
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
              {summaryStats.totalSold.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">Total units moved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <IconPackages className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.totalCategories}
            </div>
            <p className="text-muted-foreground text-xs">Active categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Order Value
            </CardTitle>
            <IconTrophy className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.averageOrderValue)}
            </div>
            <p className="text-muted-foreground text-xs">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance Data</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Loading category data...
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Market Share</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {category.name || 'Unknown Category'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {category.productCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {category.totalSold || 0}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(category.revenue || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{(category.marketShare || 0).toFixed(1)}%</span>
                          <div className="h-1 w-16 rounded-full bg-gray-200">
                            <div
                              className="bg-primary h-1 rounded-full"
                              style={{ width: `${category.marketShare || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(category.averageOrderValue || 0)}
                      </TableCell>
                      <TableCell>
                        {getTrendBadge(
                          category.trending || 'stable',
                          category.trendPercentage || 0
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="text-muted-foreground mt-4 text-sm">
                {categories.length} Categories • {summaryStats?.totalSold || 0}{' '}
                Items sold • {formatCurrency(summaryStats?.totalRevenue || 0)}{' '}
                Total revenue
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-end">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            handlePageChange(Math.max(1, currentPage - 1))
                          }
                          className={
                            currentPage === 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                      {currentPage > 2 && (
                        <>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => handlePageChange(1)}
                              className="cursor-pointer"
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {currentPage > 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}
                      {currentPage > 1 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="cursor-pointer"
                          >
                            {currentPage - 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink isActive className="cursor-pointer">
                          {currentPage}
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage < totalPages && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="cursor-pointer"
                          >
                            {currentPage + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      {currentPage < totalPages - 1 && (
                        <>
                          {currentPage < totalPages - 2 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => handlePageChange(totalPages)}
                              className="cursor-pointer"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            handlePageChange(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          className={
                            currentPage === totalPages
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
