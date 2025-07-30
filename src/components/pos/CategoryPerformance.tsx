'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  IconSearch,
  IconDownload,
  IconDots,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

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
}

async function fetchCategoryAnalytics(
  period: string,
  fromDate?: string,
  toDate?: string,
  search?: string
): Promise<CategoryAnalyticsResponse> {
  const params = new URLSearchParams();
  params.append('period', period);

  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (search) params.append('search', search);

  const response = await fetch(`/api/pos/analytics/categories?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch category analytics');
  }
  return response.json();
}

export function CategoryPerformance({ user: _ }: CategoryPerformanceProps) {
  const [period, setPeriod] = useState('30d');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [showFilter, setShowFilter] = useState('all-categories');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['category-analytics', period, fromDate, toDate, searchTerm],
    queryFn: () => fetchCategoryAnalytics(period, fromDate, toDate, searchTerm),
  });

  if (error) {
    toast.error('Failed to load category analytics data');
  }

  const categories = useMemo(
    () => analyticsData?.categories || [],
    [analyticsData?.categories]
  );

  const filteredData = useMemo(() => {
    let filtered = categories;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply performance filter
    if (showFilter === 'top-performing') {
      filtered = filtered.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    } else if (showFilter === 'low-performing') {
      filtered = filtered.sort((a, b) => a.revenue - b.revenue).slice(0, 10);
    }

    return filtered;
  }, [categories, searchTerm, showFilter]);

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

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    // Clear custom date range when using predefined periods
    if (newPeriod !== 'custom') {
      setFromDate('');
      setToDate('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Select value={showFilter} onValueChange={setShowFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Show" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-categories">All categories</SelectItem>
              <SelectItem value="top-performing">Top performing</SelectItem>
              <SelectItem value="low-performing">Low performing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {period === 'custom' && (
        <div className="flex items-center gap-3">
          <Input
            type="date"
            placeholder="From date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="w-[150px]"
          />
          <Input
            type="date"
            placeholder="To date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="w-[150px]"
          />
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.totalCategories}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalSold}</div>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats.averageOrderValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Categories</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Compare
              </Button>
              <div className="relative">
                <IconSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <IconDownload className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <IconDots className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
                    <TableHead>Items Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Market Share</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name || 'Unknown Category'}
                      </TableCell>
                      <TableCell>{category.totalSold || 0}</TableCell>
                      <TableCell>
                        {formatCurrency(category.revenue || 0)}
                      </TableCell>
                      <TableCell>
                        {(category.marketShare || 0).toFixed(1)}%
                      </TableCell>
                      <TableCell>{category.productCount || 0}</TableCell>
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
                {filteredData.length} Categories •{' '}
                {summaryStats?.totalSold || 0} Items sold •{' '}
                {formatCurrency(summaryStats?.totalRevenue || 0)} Total revenue
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
