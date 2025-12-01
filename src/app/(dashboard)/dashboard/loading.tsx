import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  IconShoppingCart,
  IconPackage,
  IconCurrencyNaira,
  IconChartLine,
} from '@tabler/icons-react';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 px-4 py-6 lg:px-6">
      {/* Header Skeleton */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="bg-muted h-9 w-48 animate-pulse rounded" />
          <div className="bg-muted h-5 w-80 animate-pulse rounded" />
        </div>
      </div>

      {/* Main Overview Cards Skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* POS Card Skeleton */}
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                  <IconShoppingCart className="h-5 w-5" />
                </div>
                POS
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="bg-muted h-8 w-24 animate-pulse rounded" />
              <div className="bg-muted h-4 w-16 animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Card Skeleton */}
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <div className="rounded-lg bg-green-100 p-2 text-green-600">
                  <IconPackage className="h-5 w-5" />
                </div>
                Inventory
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="bg-muted h-8 w-20 animate-pulse rounded" />
              <div className="bg-muted h-4 w-16 animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>

        {/* Finance Card Skeleton */}
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                  <IconCurrencyNaira className="h-5 w-5" />
                </div>
                Finance
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="bg-muted h-8 w-24 animate-pulse rounded" />
              <div className="bg-muted h-4 w-16 animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChartLine className="h-5 w-5" />
              Sales Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center">
              <div className="text-muted-foreground">Loading sales data...</div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products Chart Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPackage className="h-5 w-5" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center">
              <div className="text-muted-foreground">
                Loading product data...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <IconShoppingCart className="h-5 w-5" />
              Recent Transactions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-muted h-4 w-4 animate-pulse rounded-full" />
                  <div className="bg-muted h-4 w-32 animate-pulse rounded" />
                </div>
                <div className="bg-muted h-4 w-20 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted h-9 animate-pulse rounded-md"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
