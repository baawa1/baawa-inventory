"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
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
import { IconCurrencyNaira } from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

// Sample data - in production, this would come from API
const salesData = [
  { date: "2024-01-01", sales: 45000, orders: 12 },
  { date: "2024-01-02", sales: 52000, orders: 15 },
  { date: "2024-01-03", sales: 38000, orders: 10 },
  { date: "2024-01-04", sales: 61000, orders: 18 },
  { date: "2024-01-05", sales: 47000, orders: 13 },
  { date: "2024-01-06", sales: 55000, orders: 16 },
  { date: "2024-01-07", sales: 72000, orders: 22 },
  { date: "2024-01-08", sales: 49000, orders: 14 },
  { date: "2024-01-09", sales: 66000, orders: 19 },
  { date: "2024-01-10", sales: 58000, orders: 17 },
  { date: "2024-01-11", sales: 43000, orders: 11 },
  { date: "2024-01-12", sales: 67000, orders: 20 },
  { date: "2024-01-13", sales: 54000, orders: 15 },
  { date: "2024-01-14", sales: 71000, orders: 21 },
];

interface SalesChartProps {
  dateRange?: any;
}

export function SalesChart({ dateRange: _dateRange }: SalesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCurrencyNaira className="h-5 w-5" />
          Sales Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-sales)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-sales)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value: any) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                    formatter={(value: any, name: string) => [
                      name === "sales" ? formatCurrency(value) : value,
                      name === "sales" ? "Sales" : "Orders",
                    ]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="var(--color-sales)"
                fill="url(#fillSales)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
