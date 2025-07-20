"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconCurrencyNaira,
  IconShoppingCart,
  IconTrendingUp,
  IconUsers,
  IconPackages,
  IconCalendar,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface SalesOverview {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  topSellingProducts: {
    id: number;
    name: string;
    totalSold: number;
    revenue: number;
  }[];
  salesByPeriod: {
    period: string;
    sales: number;
    orders: number;
  }[];
  recentTransactions: {
    id: number;
    transactionNumber: string;
    customerName: string | null;
    totalAmount: number;
    createdAt: string;
  }[];
}

interface SalesAnalyticsProps {
  user: {
    id: string;
    role: string;
  };
}

async function fetchSalesOverview(period: string): Promise<SalesOverview> {
  const response = await fetch(`/api/pos/analytics/overview?period=${period}`);
  if (!response.ok) {
    throw new Error("Failed to fetch sales overview");
  }
  return response.json();
}

export function SalesAnalytics({ user: _user }: SalesAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  const {
    data: salesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sales-overview", selectedPeriod],
    queryFn: () => fetchSalesOverview(selectedPeriod),
  });

  if (error) {
    toast.error("Failed to load sales data");
  }

  const periods = [
    { value: "1d", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of your sales performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : salesData ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sales
                </CardTitle>
                <IconCurrencyNaira className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(salesData.totalSales)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <IconTrendingUp className="h-3 w-3 mr-1" />
                  vs previous period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
                <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesData.totalOrders}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <IconArrowUp className="h-3 w-3 mr-1" />
                  +12% from last period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Unique Customers
                </CardTitle>
                <IconUsers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesData.totalCustomers}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <IconArrowUp className="h-3 w-3 mr-1" />
                  +8% from last period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Order Value
                </CardTitle>
                <IconCurrencyNaira className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(salesData.averageOrderValue)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <IconArrowDown className="h-3 w-3 mr-1" />
                  -2% from last period
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/pos/analytics/products">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Product Performance
                  </CardTitle>
                  <IconPackages className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Analyze individual product sales and trends
                  </div>
                  <Button variant="outline" size="sm" className="mt-3">
                    View Details →
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/pos/analytics/categories">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Category Analysis
                  </CardTitle>
                  <IconPackages className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Compare performance across product categories
                  </div>
                  <Button variant="outline" size="sm" className="mt-3">
                    View Details →
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/pos/customers">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Customer Insights
                  </CardTitle>
                  <IconUsers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    View customer leaderboard and purchase patterns
                  </div>
                  <Button variant="outline" size="sm" className="mt-3">
                    View Details →
                  </Button>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesData.topSellingProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.totalSold} units sold
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(product.revenue)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Revenue
                      </div>
                    </div>
                  </div>
                ))}
                {salesData.topSellingProducts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No sales data available for the selected period.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/pos/history">View All →</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesData.recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <IconShoppingCart className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">
                          #{transaction.transactionNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.customerName || "Walk-in Customer"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(transaction.totalAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <IconCalendar className="h-3 w-3 mr-1" />
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {salesData.recentTransactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent transactions found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No data available for the selected period.
        </div>
      )}
    </div>
  );
}
