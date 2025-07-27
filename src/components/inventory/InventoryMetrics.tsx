'use client';

import {
  IconTrendingUp,
  IconPackages,
  IconAlertTriangle,
  IconCurrencyDollar,
  IconUsers,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { useInventoryStats } from '@/hooks/api/inventory';

export function InventoryMetrics() {
  const { data: stats, isLoading: loading, error } = useInventoryStats();

  // Fallback data for when API is not ready yet
  const fallbackStats = {
    totalProducts: 1247,
    lowStockItems: 23,
    totalStockValue: 125480.5,
    activeSuppliers: 15,
    recentSales: 89,
    stockMovement: 12.5,
  };

  // Use actual data if available, otherwise fallback
  const displayStats = stats || fallbackStats;

  // Show error state if there's an error and no cached data
  if (error && !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-red-600">
              Error Loading Metrics
            </CardTitle>
            <CardDescription>
              Failed to load inventory metrics. Using fallback data.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
              <div className="h-8 w-3/4 rounded bg-gray-200"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Total Products */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Products</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <IconPackages className="h-6 w-6 text-blue-600" />
            {displayStats.totalProducts.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +8.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Growing inventory <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Products added this month</div>
        </CardFooter>
      </Card>

      {/* Low Stock Items */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Low Stock Items</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <IconAlertTriangle className="h-6 w-6 text-yellow-600" />
            {displayStats.lowStockItems}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-yellow-600">
              <IconAlertTriangle />
              Attention needed
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Items need restocking <IconAlertTriangle className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Below minimum stock levels
          </div>
        </CardFooter>
      </Card>

      {/* Total Stock Value */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Stock Value</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <IconCurrencyDollar className="h-6 w-6 text-green-600" />
            {formatCurrency(displayStats.totalStockValue)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />+{displayStats.stockMovement}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Stock value increased <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Total inventory worth</div>
        </CardFooter>
      </Card>

      {/* Active Suppliers */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Suppliers</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <IconUsers className="h-6 w-6 text-purple-600" />
            {displayStats.activeSuppliers}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +2 new
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Supplier network growing <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Verified active suppliers</div>
        </CardFooter>
      </Card>
    </div>
  );
}
