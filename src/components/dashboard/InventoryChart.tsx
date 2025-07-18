"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { IconPackages, IconAlertTriangle } from "@tabler/icons-react";

const chartConfig = {
  inStock: {
    label: "In Stock",
    color: "hsl(var(--primary))",
  },
  lowStock: {
    label: "Low Stock",
    color: "hsl(142 76% 36%)",
  },
  outOfStock: {
    label: "Out of Stock",
    color: "hsl(0 84% 60%)",
  },
} satisfies ChartConfig;

// Sample inventory data by category
const inventoryData = [
  {
    category: "Electronics",
    inStock: 145,
    lowStock: 12,
    outOfStock: 3,
    total: 160,
  },
  {
    category: "Accessories",
    inStock: 89,
    lowStock: 8,
    outOfStock: 2,
    total: 99,
  },
  {
    category: "Watches",
    inStock: 67,
    lowStock: 5,
    outOfStock: 1,
    total: 73,
  },
  {
    category: "Jewelry",
    inStock: 234,
    lowStock: 15,
    outOfStock: 4,
    total: 253,
  },
  {
    category: "Bags",
    inStock: 78,
    lowStock: 6,
    outOfStock: 2,
    total: 86,
  },
];

export function InventoryChart() {
  const totalProducts = inventoryData.reduce((sum, cat) => sum + cat.total, 0);
  const totalLowStock = inventoryData.reduce(
    (sum, cat) => sum + cat.lowStock,
    0
  );
  const totalOutOfStock = inventoryData.reduce(
    (sum, cat) => sum + cat.outOfStock,
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <IconPackages className="h-5 w-5" />
            Inventory Overview
          </span>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              {totalProducts} Total
            </Badge>
            {totalLowStock > 0 && (
              <Badge
                variant="outline"
                className="text-orange-600 border-orange-200 text-xs"
              >
                <IconAlertTriangle className="h-3 w-3 mr-1" />
                {totalLowStock} Low
              </Badge>
            )}
            {totalOutOfStock > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalOutOfStock} Out
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value: any, name: string) => [
                      value,
                      name === "inStock"
                        ? "In Stock"
                        : name === "lowStock"
                          ? "Low Stock"
                          : "Out of Stock",
                    ]}
                  />
                }
              />
              <Bar
                dataKey="inStock"
                stackId="inventory"
                fill="var(--color-inStock)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="lowStock"
                stackId="inventory"
                fill="var(--color-lowStock)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="outOfStock"
                stackId="inventory"
                fill="var(--color-outOfStock)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: "var(--color-inStock)" }}
            ></div>
            <span className="text-sm text-muted-foreground">In Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: "var(--color-lowStock)" }}
            ></div>
            <span className="text-sm text-muted-foreground">Low Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: "var(--color-outOfStock)" }}
            ></div>
            <span className="text-sm text-muted-foreground">Out of Stock</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
