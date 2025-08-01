'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
import {
  Package,
  AlertTriangle,
  DollarSign,
  Clock,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  Layers,
  Tag,
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface ProductOverviewData {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockValue: number;
  totalQuantity: number;
  totalSold: number;
  categoryBreakdown: Array<{
    categoryName: string;
    productCount: number;
    totalStock: number;
  }>;
  recentStockChanges: Array<{
    id: number;
    productName: string;
    change: number;
    type: 'addition' | 'reconciliation' | 'sale';
    timestamp: string;
  }>;
}

// Summary Card Component
function SummaryCard({
  title,
  value,
  icon: Icon,
  isLoading,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  icon: any;
  isLoading: boolean;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 rounded" />
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const displayValue =
    typeof value === 'number' && title.toLowerCase().includes('value')
      ? formatCurrency(value)
      : value;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue}</div>
        {trend && trendValue && (
          <div className="mt-1 flex items-center gap-1">
            {trend === 'up' ? (
              <ArrowUp className="h-3 w-3 text-green-600" />
            ) : trend === 'down' ? (
              <ArrowDown className="h-3 w-3 text-red-600" />
            ) : null}
            <span
              className={`text-xs ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductOverview() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Fetch product overview data
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['product-overview', dateRange],
    queryFn: async (): Promise<ProductOverviewData> => {
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append('fromDate', dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange?.to) {
        params.append('toDate', dateRange.to.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/inventory/overview?${params}`);
      if (!response.ok) throw new Error('Failed to fetch product overview');
      return response.json();
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Product Overview
          </h2>
          <p className="text-muted-foreground">
            Quick overview of your inventory status and recent activity
          </p>
        </div>

        <div className="flex gap-3">
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={handleDateRangeChange}
            placeholder="Select date range"
          />
        </div>
      </div>

      {/* Summary Cards - Main Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Products"
          value={overviewData?.totalProducts || 0}
          icon={Package}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Total Quantity"
          value={overviewData?.totalQuantity || 0}
          icon={Layers}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Total Sold"
          value={overviewData?.totalSold || 0}
          icon={ShoppingCart}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Stock Value"
          value={overviewData?.totalStockValue || 0}
          icon={DollarSign}
          isLoading={isLoading}
        />
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Low Stock Items"
          value={overviewData?.lowStockProducts || 0}
          icon={AlertTriangle}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Categories"
          value={overviewData?.categoryBreakdown?.length || 0}
          icon={Tag}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Active Products"
          value={overviewData?.activeProducts || 0}
          icon={Package}
          isLoading={isLoading}
        />
      </div>

      {/* Category Breakdown */}
      {overviewData?.categoryBreakdown &&
        overviewData.categoryBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Products by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {overviewData.categoryBreakdown.map((category, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{category.categoryName}</p>
                      <p className="text-muted-foreground text-sm">
                        {category.productCount} products
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{category.totalStock}</p>
                      <p className="text-muted-foreground text-xs">in stock</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Stock Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              ))}
            </div>
          ) : overviewData?.recentStockChanges?.length ? (
            <div className="space-y-3">
              {overviewData.recentStockChanges.slice(0, 10).map(change => (
                <div
                  key={change.id}
                  className="flex items-center justify-between border-b py-2 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{change.productName}</span>
                    <Badge
                      variant={change.change > 0 ? 'default' : 'destructive'}
                    >
                      {change.change > 0 ? '+' : ''}
                      {change.change}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span className="capitalize">{change.type}</span>
                    <span>•</span>
                    <span>{formatDate(change.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No recent stock activity</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      {overviewData && overviewData.lowStockProducts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-orange-800">
                You have <strong>{overviewData.lowStockProducts}</strong>{' '}
                products with low stock levels.
                {overviewData.outOfStockProducts > 0 && (
                  <span>
                    {' '}
                    <strong>{overviewData.outOfStockProducts}</strong> products
                    are out of stock.
                  </span>
                )}
              </p>
              <p className="mt-2 text-sm text-orange-700">
                Review your inventory and consider restocking these items.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
