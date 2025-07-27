'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';

import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { AppUser } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';

interface FinanceOverviewProps {
  user: AppUser;
}

// API function to fetch financial summary
const fetchFinancialSummary = async () => {
  const response = await fetch('/api/finance/summary');
  if (!response.ok) {
    throw new Error('Failed to fetch financial summary');
  }
  return response.json();
};

export function FinanceOverview({ user: _user }: FinanceOverviewProps) {
  const {
    data: summaryData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.finance.summary(),
    queryFn: fetchFinancialSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Finance Overview"
          description="Track your business finances and financial performance"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Loading...
                </CardTitle>
                <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-muted-foreground text-xs">Loading...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Finance Overview"
          description="Track your business finances and financial performance"
        />
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-destructive">Failed to load financial data</p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentMonth = summaryData?.data?.currentMonth || {
    income: 0,
    expenses: 0,
    netIncome: 0,
    transactionCount: 0,
  };

  const previousMonth = summaryData?.data?.previousMonth || {
    income: 0,
    expenses: 0,
    netIncome: 0,
    transactionCount: 0,
  };

  const recentTransactions = summaryData?.data?.recentTransactions || [];

  // Calculate percentage changes
  const incomeChange =
    previousMonth.income > 0
      ? ((currentMonth.income - previousMonth.income) / previousMonth.income) *
        100
      : 0;

  const expenseChange =
    previousMonth.expenses > 0
      ? ((currentMonth.expenses - previousMonth.expenses) /
          previousMonth.expenses) *
        100
      : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Finance Overview"
          description="Track your business finances and financial performance"
        />
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/finance/income/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Income
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/finance/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonth.income)}
            </div>
            <div className="text-muted-foreground flex items-center text-xs">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              {incomeChange > 0 ? '+' : ''}
              {incomeChange.toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonth.expenses)}
            </div>
            <div className="text-muted-foreground flex items-center text-xs">
              <ArrowDownRight className="mr-1 h-3 w-3" />
              {expenseChange > 0 ? '+' : ''}
              {expenseChange.toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${currentMonth.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(currentMonth.netIncome)}
            </div>
            <p className="text-muted-foreground text-xs">
              {currentMonth.netIncome >= 0 ? 'Profit' : 'Loss'} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonth.transactionCount}
            </div>
            <p className="text-muted-foreground text-xs">
              Total transactions this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest financial transactions across all sources
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/finance/transactions">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.slice(0, 5).map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Badge
                        variant={
                          transaction.type === 'INCOME'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {transaction.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-muted-foreground text-sm">
                        {new Date(
                          transaction.transactionDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {transaction.source}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Receipt className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-muted-foreground">No recent transactions</p>
              <Button asChild className="mt-4">
                <Link href="/finance/income/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Transaction
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Income Management</CardTitle>
            <CardDescription>
              Track and manage your income sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/finance/income">View All Income</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/finance/income/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Income
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Management</CardTitle>
            <CardDescription>Track and manage your expenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/finance/expenses">View All Expenses</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/finance/expenses/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reports & Analytics</CardTitle>
            <CardDescription>
              Generate financial reports and insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/finance/reports">View Reports</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/finance/reports">Financial Summary</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
