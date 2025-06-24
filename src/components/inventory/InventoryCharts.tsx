"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";

interface StockData {
  month: string;
  stockIn: number;
  stockOut: number;
}

interface SalesData {
  category: string;
  sales: number;
  revenue: number;
}

// For now, we'll use a simple chart placeholder
// In a real implementation, you'd use Recharts or Chart.js
export function InventoryCharts() {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);

  useEffect(() => {
    // Mock data for charts - in real implementation, fetch from API
    setStockData([
      { month: "Jan", stockIn: 400, stockOut: 240 },
      { month: "Feb", stockIn: 300, stockOut: 139 },
      { month: "Mar", stockIn: 200, stockOut: 180 },
      { month: "Apr", stockIn: 278, stockOut: 190 },
      { month: "May", stockIn: 189, stockOut: 130 },
      { month: "Jun", stockIn: 239, stockOut: 160 },
    ]);

    setSalesData([
      { category: "Wristwatches", sales: 45, revenue: 12500 },
      { category: "Sunglasses", sales: 32, revenue: 8900 },
      { category: "Accessories", sales: 28, revenue: 6700 },
      { category: "Electronics", sales: 15, revenue: 4200 },
    ]);
  }, []);

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
                      className="h-2 bg-green-500 rounded"
                      style={{ width: `${(item.stockIn / 400) * 100}%` }}
                    ></div>
                    <span className="text-xs text-gray-500">
                      {item.stockIn} in
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="h-2 bg-red-500 rounded"
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
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Stock In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
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
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{category.category}</span>
                    <Badge variant="outline">
                      {index === 0 ? (
                        <IconTrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <IconTrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {category.sales} sales
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(category.revenue)} revenue
                  </div>
                  <div className="mt-2 h-2 bg-primary/20 rounded overflow-hidden">
                    <div
                      className="h-full bg-primary rounded"
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
