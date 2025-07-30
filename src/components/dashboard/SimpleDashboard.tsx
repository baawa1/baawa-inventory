'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconShoppingCart,
  IconPackage,
  IconCurrencyNaira,
  IconChartLine,
  IconArrowRight,
  IconPlus,
  IconSettings,
  IconFileText,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { useTransactionStats } from '@/hooks/api/transactions';
import { useInventoryStats } from '@/hooks/api/inventory';
import { useFinancialAnalyticsSummary } from '@/hooks/api/useFinancialAnalytics';
import { useSalesTrends } from '@/hooks/api/useSalesTrends';
import { useTopProducts } from '@/hooks/api/useTopProducts';
import { useRecentTransactions } from '@/hooks/api/useRecentTransactions';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface SimpleDashboardProps {
  user: any;
}

export function SimpleDashboard({ user }: SimpleDashboardProps) {
  // Fetch data
  const { data: transactionStats, isLoading: isLoadingStats } =
    useTransactionStats();
  const { data: inventoryStats, isLoading: isLoadingInventory } =
    useInventoryStats();
  const { data: financeData, isLoading: isLoadingFinance } =
    useFinancialAnalyticsSummary();
  // Fetch chart data from APIs
  const { data: salesTrends, isLoading: isLoadingSalesTrends } =
    useSalesTrends();
  const { data: topProductsData, isLoading: isLoadingTopProducts } =
    useTopProducts();
  const { data: recentTransactions, isLoading: isLoadingTransactions } =
    useRecentTransactions(5);



  // Get inventory metrics from API
  const totalProducts = inventoryStats?.totalProducts || 0;
  const lowStockItems = inventoryStats?.lowStockItems || 0;
  const inStockItems = inventoryStats?.inStockItems || 0;
  const outOfStockItems = inventoryStats?.outOfStockItems || 0;

  // Use real data or fallback to empty arrays
  const salesData = salesTrends || [];
  const topProducts = topProductsData || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.firstName}! Here&apos;s your business overview.
          </p>
        </div>
      </div>

      {/* Main Overview Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* POS Card */}
        <Link href="/pos">
          <Card className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                    <IconShoppingCart className="h-5 w-5" />
                  </div>
                  POS
                </span>
                <IconArrowRight className="text-muted-foreground h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="space-y-2">
                  <div className="bg-muted h-8 w-24 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-2xl font-bold">
                    {formatCurrency(transactionStats?.totalSales || 0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {transactionStats?.totalTransactions || 0} transactions
                      </Badge>
                      {transactionStats?.salesChange && (
                        <span className="flex items-center gap-1 text-sm">
                          {transactionStats.salesChange >= 0 ? (
                            <IconTrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <IconTrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          {Math.abs(transactionStats.salesChange).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Avg:{' '}
                      {formatCurrency(transactionStats?.averageOrderValue || 0)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Last 30 days
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Inventory Card */}
        <Link href="/inventory">
          <Card className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <div className="rounded-lg bg-green-100 p-2 text-green-600">
                    <IconPackage className="h-5 w-5" />
                  </div>
                  Inventory
                </span>
                <IconArrowRight className="text-muted-foreground h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingInventory ? (
                <div className="space-y-2">
                  <div className="bg-muted h-8 w-20 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-2xl font-bold">
                    {totalProducts.toLocaleString()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>In Stock:</span>
                      <span className="font-medium text-green-600">
                        {inStockItems.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Low Stock:</span>
                      <span className="font-medium text-yellow-600">
                        {lowStockItems.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Out of Stock:</span>
                      <span className="font-medium text-red-600">
                        {outOfStockItems.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Current stock levels
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Finance Card */}
        <Link href="/finance">
          <Card className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                    <IconCurrencyNaira className="h-5 w-5" />
                  </div>
                  Finance
                </span>
                <IconArrowRight className="text-muted-foreground h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFinance ? (
                <div className="space-y-2">
                  <div className="bg-muted h-8 w-24 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-2xl font-bold">
                    {formatCurrency(financeData?.netProfit || 0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Revenue:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(financeData?.totalRevenue || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Expenses:</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(financeData?.totalExpenses || 0)}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Last 30 days
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChartLine className="h-5 w-5" />
              Sales Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSalesTrends ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="text-muted-foreground">
                  Loading sales data...
                </div>
              </div>
            ) : salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={value => formatCurrency(Number(value))} />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center">
                <div className="text-muted-foreground">
                  No sales data available
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPackage className="h-5 w-5" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTopProducts ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="text-muted-foreground">
                  Loading product data...
                </div>
              </div>
            ) : topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={value => [value, 'Sales']} />
                  <Bar dataKey="sales" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center">
                <div className="text-muted-foreground">
                  No product data available
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <IconShoppingCart className="h-5 w-5" />
              Recent Transactions
            </span>
            <Link href="/pos/history">
              <Button variant="outline" size="sm" className="text-xs">
                View All
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
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
          ) : (
            <div className="space-y-3">
              {recentTransactions?.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {transaction.customerName}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {transaction.firstItem} • {transaction.totalItems} items
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">
                      {formatCurrency(transaction.totalAmount)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {(!recentTransactions || recentTransactions.length === 0) && (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  No recent transactions
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link href="/pos">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <IconShoppingCart className="h-4 w-4" />
                Open POS
              </Button>
            </Link>
            <Link href="/inventory/products/new">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <IconPlus className="h-4 w-4" />
                Add Product
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <IconFileText className="h-4 w-4" />
                View Reports
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <IconSettings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
