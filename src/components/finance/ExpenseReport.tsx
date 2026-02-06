'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconDownload,
  IconPrinter,
  IconTrendingDown,
  IconRefresh,
  IconCash,
  IconChartBar,
  IconFilter,
} from '@tabler/icons-react';
import { DateRange } from 'react-day-picker';
import { formatCurrency } from '@/lib/utils';
import { useFinancialAnalytics } from '@/hooks/api/useFinancialAnalytics';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { AppUser } from '@/types/user';
import { EXPENSE_TYPE_LABELS } from '@/lib/constants/finance';
import {
  exportToCSV,
  generateExportFilename,
} from '@/lib/utils/finance';

interface ExpenseReportProps {
  user: AppUser;
}

export function ExpenseReport({ user: _user }: ExpenseReportProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [_period, setPeriod] = useState('monthly');
  const [expenseCategory, setExpenseCategory] = useState('all');

  const {
    data: analyticsData,
    isLoading,
    refetch,
  } = useFinancialAnalytics({
    dateRange,
    type: 'expense',
  });

  const summary = analyticsData?.summary;
  const expenseBreakdown = analyticsData?.expenseBreakdown || {};
  const topVendors = analyticsData?.topVendors || [];

  const totalExpenses = summary?.totalExpenses || 0;
  const expenseGrowth = summary?.expenseGrowth || 0;

  const filteredBreakdown = useMemo(() => {
    if (expenseCategory === 'all') {
      return expenseBreakdown;
    }
    const categoryKey = expenseCategory.toUpperCase();
    if (expenseBreakdown[categoryKey] !== undefined) {
      return { [categoryKey]: expenseBreakdown[categoryKey] };
    }
    return expenseBreakdown;
  }, [expenseBreakdown, expenseCategory]);

  const sortedBreakdownEntries = useMemo(() => {
    return Object.entries(filteredBreakdown).sort(([, a], [, b]) => b - a);
  }, [filteredBreakdown]);

  const topCategory = useMemo(() => {
    if (sortedBreakdownEntries.length === 0) return { name: 'N/A', amount: 0 };
    const [name, amount] = sortedBreakdownEntries[0];
    return {
      name: EXPENSE_TYPE_LABELS[name as keyof typeof EXPENSE_TYPE_LABELS] || name,
      amount,
    };
  }, [sortedBreakdownEntries]);

  const categoryCount = Object.keys(expenseBreakdown).length;
  const vendorCount = topVendors.length;

  const handleExportReport = () => {
    const exportData: { Category: string; Amount: number; Percentage: string }[] = sortedBreakdownEntries.map(([category, amount]) => ({
      Category: EXPENSE_TYPE_LABELS[category as keyof typeof EXPENSE_TYPE_LABELS] || category,
      Amount: amount,
      Percentage: totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(2) + '%' : '0%',
    }));

    if (topVendors.length > 0) {
      exportData.push({ Category: '---', Amount: 0, Percentage: '---' });
      exportData.push({ Category: 'TOP VENDORS', Amount: 0, Percentage: '' });
      topVendors.forEach(v => {
        exportData.push({
          Category: v.vendor,
          Amount: v.amount,
          Percentage: v.category,
        });
      });
    }

    const filename = generateExportFilename('expense-report');
    exportToCSV(exportData, filename);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="py-8 text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground mt-2">Loading expense data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 print:p-2">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Report</h1>
          <p className="text-muted-foreground">
            Comprehensive expense analysis and breakdown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={_period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <IconRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExportReport} variant="outline" size="sm">
            <IconDownload className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handlePrintReport} variant="outline" size="sm">
            <IconPrinter className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">Expense Report</h1>
        <p className="text-sm text-gray-600">
          {dateRange?.from?.toLocaleDateString()} - {dateRange?.to?.toLocaleDateString()}
        </p>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFilter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                placeholder="Select date range for expense analysis"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Expense Category</label>
              <Select
                value={expenseCategory}
                onValueChange={setExpenseCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="INVENTORY_PURCHASES">Inventory Purchases</SelectItem>
                  <SelectItem value="SALARIES">Salaries</SelectItem>
                  <SelectItem value="RENT">Rent</SelectItem>
                  <SelectItem value="UTILITIES">Utilities</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="OFFICE_SUPPLIES">Office Supplies</SelectItem>
                  <SelectItem value="TRAVEL">Travel</SelectItem>
                  <SelectItem value="INSURANCE">Insurance</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <IconTrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-muted-foreground text-xs">
              {expenseGrowth >= 0 ? '+' : ''}{expenseGrowth.toFixed(1)}% from previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Per Transaction
            </CardTitle>
            <IconCash className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summary?.averageTransactionValue || 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              Based on {summary?.totalTransactions || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <IconChartBar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 truncate">
              {topCategory.name}
            </div>
            <p className="text-muted-foreground text-xs">
              {totalExpenses > 0
                ? ((topCategory.amount / totalExpenses) * 100).toFixed(1)
                : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
            <IconCash className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {vendorCount}
            </div>
            <p className="text-muted-foreground text-xs">
              Active vendors this period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconChartBar className="h-5 w-5" />
            Expense Breakdown by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedBreakdownEntries.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No expense data for this period</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedBreakdownEntries.map(([category, amount]) => (
                <div
                  key={category}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">
                      {EXPENSE_TYPE_LABELS[category as keyof typeof EXPENSE_TYPE_LABELS] || category}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {totalExpenses > 0
                        ? ((amount / totalExpenses) * 100).toFixed(1)
                        : 0}% of total
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">
                      {formatCurrency(amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendor Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCash className="h-5 w-5" />
            Top Vendor Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topVendors.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No vendor data for this period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topVendors.map((vendor, index) => (
                <div
                  key={vendor.vendor}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                    >
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium">{vendor.vendor}</div>
                      <div className="text-muted-foreground text-sm">
                        {EXPENSE_TYPE_LABELS[vendor.category as keyof typeof EXPENSE_TYPE_LABELS] || vendor.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">
                      {formatCurrency(vendor.amount)}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {totalExpenses > 0
                        ? ((vendor.amount / totalExpenses) * 100).toFixed(1)
                        : 0}% of total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpenses)}
                </div>
                <div className="text-sm text-red-600">Total Expenses</div>
              </div>
              <div className="rounded-lg bg-orange-50 p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(summary?.averageTransactionValue || 0)}
                </div>
                <div className="text-sm text-orange-600">Avg Transaction</div>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {vendorCount}
                </div>
                <div className="text-sm text-purple-600">Active Vendors</div>
              </div>
              <div className="rounded-lg bg-indigo-50 p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {categoryCount}
                </div>
                <div className="text-sm text-indigo-600">Categories</div>
              </div>
            </div>

            {sortedBreakdownEntries.length > 0 && (
              <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <h3 className="mb-2 font-semibold">
                  Expense Management Insights
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Largest Expense Category:</strong> {topCategory.name} at{' '}
                    {formatCurrency(topCategory.amount)} (
                    {totalExpenses > 0
                      ? ((topCategory.amount / totalExpenses) * 100).toFixed(1)
                      : 0}% of total)
                  </p>
                  {topVendors.length > 0 && (
                    <p>
                      <strong>Top Vendor:</strong> {topVendors[0].vendor} accounts for{' '}
                      {totalExpenses > 0
                        ? ((topVendors[0].amount / totalExpenses) * 100).toFixed(1)
                        : 0}% of total expenses
                    </p>
                  )}
                  <p>
                    <strong>Period Change:</strong>{' '}
                    {expenseGrowth >= 0 ? 'Expenses increased' : 'Expenses decreased'} by{' '}
                    {Math.abs(expenseGrowth).toFixed(1)}% compared to previous period
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
