"use client";

import { useEffect, useState } from "react";
import {
  IconTrendingDown,
  IconTrendingUp,
  IconPackages,
  IconAlertTriangle,
  IconCurrencyDollar,
  IconUsers,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface InventoryStats {
  totalProducts: number;
  lowStockItems: number;
  totalStockValue: number;
  activeSuppliers: number;
  recentSales: number;
  stockMovement: number;
}

export function InventoryMetrics() {
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockItems: 0,
    totalStockValue: 0,
    activeSuppliers: 0,
    recentSales: 0,
    stockMovement: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch inventory statistics
    const fetchStats = async () => {
      try {
        // For now, using mock data. In real implementation, this would fetch from API
        setStats({
          totalProducts: 1247,
          lowStockItems: 23,
          totalStockValue: 125480.5,
          activeSuppliers: 15,
          recentSales: 89,
          stockMovement: 12.5,
        });
      } catch (error) {
        console.error("Failed to fetch inventory stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Total Products */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Products</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconPackages className="h-6 w-6 text-blue-600" />
            {stats.totalProducts.toLocaleString()}
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
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconAlertTriangle className="h-6 w-6 text-yellow-600" />
            {stats.lowStockItems}
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
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconCurrencyDollar className="h-6 w-6 text-green-600" />
            {formatCurrency(stats.totalStockValue)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />+{stats.stockMovement}%
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
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconUsers className="h-6 w-6 text-purple-600" />
            {stats.activeSuppliers}
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
