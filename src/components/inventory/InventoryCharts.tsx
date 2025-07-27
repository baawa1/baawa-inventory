'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { useInventoryCharts } from '@/hooks/api/inventory';

// For now, we'll use a simple chart placeholder
// In a real implementation, you'd use Recharts or Chart.js
export function InventoryCharts() {
  const { data, isLoading, error } = useInventoryCharts();

  // Fallback data for when API is not ready yet
  const fallbackData = {
    stockData: [
      { month: 'Jan', stockIn: 400, stockOut: 240 },
      { month: 'Feb', stockIn: 300, stockOut: 139 },
      { month: 'Mar', stockIn: 200, stockOut: 180 },
      { month: 'Apr', stockIn: 278, stockOut: 190 },
      { month: 'May', stockIn: 189, stockOut: 130 },
      { month: 'Jun', stockIn: 239, stockOut: 160 },
    ],
    salesData: [
      { category: 'Wristwatches', sales: 45, revenue: 12500 },
      { category: 'Sunglasses', sales: 32, revenue: 8900 },
      { category: 'Accessories', sales: 28, revenue: 6700 },
      { category: 'Electronics', sales: 15, revenue: 4200 },
    ],
  };

  const { stockData, salesData } = data || fallbackData;

  if (error && !data) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Charts</CardTitle>
            <CardDescription>
              Failed to load chart data. Using fallback data.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
              <div className="h-3 w-3/4 rounded bg-gray-200"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-8 rounded bg-gray-200"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Stock Movement Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement</CardTitle>
          <CardDescription>
            Stock in vs stock out over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Simple bar chart representation */}
            {stockData.map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-8 text-sm font-medium">{item.month}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <div
                      className="h-2 rounded bg-green-500"
                      style={{ width: `${(item.stockIn / 400) * 100}%` }}
                    ></div>
                    <span className="text-xs text-gray-500">
                      {item.stockIn} in
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="h-2 rounded bg-red-500"
                      style={{ width: `${(item.stockOut / 400) * 100}%` }}
                    ></div>
                    <span className="text-xs text-gray-500">
                      {item.stockOut} out
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-green-500"></div>
              <span>Stock In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-red-500"></div>
              <span>Stock Out</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Categories</CardTitle>
          <CardDescription>
            Best performing product categories this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesData.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">{category.category}</span>
                    <Badge variant="outline">
                      {index === 0 ? (
                        <IconTrendingUp className="mr-1 h-3 w-3" />
                      ) : (
                        <IconTrendingDown className="mr-1 h-3 w-3" />
                      )}
                      {category.sales} sales
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(category.revenue)} revenue
                  </div>
                  <div className="bg-primary/20 mt-2 h-2 overflow-hidden rounded">
                    <div
                      className="bg-primary h-full rounded"
                      style={{ width: `${(category.sales / 45) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
