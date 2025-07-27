'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconRefresh,
  IconCash,
} from '@tabler/icons-react';
import { DateRange } from 'react-day-picker';
import { formatCurrency } from '@/lib/utils';
import { useFinancialAnalytics } from '@/hooks/api/useFinancialAnalytics';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { AppUser } from '@/types/user';

interface IncomeStatementReportProps {
  user: AppUser;
}

export function IncomeStatementReport({
  user: _user,
}: IncomeStatementReportProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date(),
  });
  const [period, setPeriod] = useState('monthly');

  const {
    data: analyticsData,
    isLoading,
    refetch,
  } = useFinancialAnalytics({
    dateRange,
    type: 'all',
  });

  const summary = analyticsData?.summary;

  // Calculate income statement data
  const incomeStatementData = {
    revenue: {
      sales: summary?.totalRevenue || 0,
      otherIncome: 50000,
      totalRevenue: (summary?.totalRevenue || 0) + 50000,
    },
    costOfGoodsSold: {
      beginningInventory: 150000,
      purchases: 200000,
      endingInventory: 120000,
      totalCOGS: 230000,
    },
    grossProfit: (summary?.totalRevenue || 0) + 50000 - 230000,
    operatingExpenses: {
      salaries: 80000,
      rent: 25000,
      utilities: 15000,
      marketing: 20000,
      insurance: 10000,
      depreciation: 15000,
      other: 5000,
      totalOperatingExpenses: 170000,
    },
    operatingIncome: (summary?.totalRevenue || 0) + 50000 - 230000 - 170000,
    otherIncome: {
      interest: 5000,
      gains: 3000,
      totalOtherIncome: 8000,
    },
    otherExpenses: {
      interest: 2000,
      losses: 1000,
      totalOtherExpenses: 3000,
    },
    netIncome:
      (summary?.totalRevenue || 0) + 50000 - 230000 - 170000 + 8000 - 3000,
  };

  const handleExportReport = () => {
    console.log('Exporting income statement...');
  };

  const handlePrintReport = () => {
    console.log('Printing income statement...');
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="py-8 text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin border-b-2"></div>
          <p className="text-muted-foreground mt-2">
            Loading income statement data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Income Statement
          </h1>
          <p className="text-muted-foreground">
            Comprehensive profit and loss statement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCalendar className="h-5 w-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Select date range for income statement"
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(incomeStatementData.revenue.totalRevenue)}
            </div>
            <p className="text-muted-foreground text-xs">
              Total income generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <IconCash className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                incomeStatementData.grossProfit >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatCurrency(incomeStatementData.grossProfit)}
            </div>
            <p className="text-muted-foreground text-xs">Revenue minus COGS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Operating Income
            </CardTitle>
            <IconTrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                incomeStatementData.operatingIncome >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatCurrency(incomeStatementData.operatingIncome)}
            </div>
            <p className="text-muted-foreground text-xs">
              Gross profit minus expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <IconCash className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                incomeStatementData.netIncome >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatCurrency(incomeStatementData.netIncome)}
            </div>
            <p className="text-muted-foreground text-xs">Final profit/loss</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Income Statement */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingUp className="h-5 w-5 text-green-600" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Sales Revenue</span>
                <span className="font-medium">
                  {formatCurrency(incomeStatementData.revenue.sales)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Other Income</span>
                <span className="font-medium">
                  {formatCurrency(incomeStatementData.revenue.otherIncome)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between font-bold">
                  <span>Total Revenue</span>
                  <span className="text-green-600">
                    {formatCurrency(incomeStatementData.revenue.totalRevenue)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost of Goods Sold */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingDown className="h-5 w-5 text-red-600" />
              Cost of Goods Sold
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Beginning Inventory</span>
                <span className="font-medium">
                  {formatCurrency(
                    incomeStatementData.costOfGoodsSold.beginningInventory
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Purchases</span>
                <span className="font-medium">
                  {formatCurrency(
                    incomeStatementData.costOfGoodsSold.purchases
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Ending Inventory</span>
                <span className="font-medium text-red-600">
                  -
                  {formatCurrency(
                    incomeStatementData.costOfGoodsSold.endingInventory
                  )}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between font-bold">
                  <span>Total COGS</span>
                  <span className="text-red-600">
                    {formatCurrency(
                      incomeStatementData.costOfGoodsSold.totalCOGS
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gross Profit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCash className="h-5 w-5 text-blue-600" />
            Gross Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-xl font-bold">
            <span>Revenue - Cost of Goods Sold</span>
            <span
              className={
                incomeStatementData.grossProfit >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }
            >
              {formatCurrency(incomeStatementData.grossProfit)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Operating Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconTrendingDown className="h-5 w-5 text-orange-600" />
            Operating Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Salaries & Wages</span>
                <span className="font-medium">
                  {formatCurrency(
                    incomeStatementData.operatingExpenses.salaries
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rent</span>
                <span className="font-medium">
                  {formatCurrency(incomeStatementData.operatingExpenses.rent)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Utilities</span>
                <span className="font-medium">
                  {formatCurrency(
                    incomeStatementData.operatingExpenses.utilities
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Marketing</span>
                <span className="font-medium">
                  {formatCurrency(
                    incomeStatementData.operatingExpenses.marketing
                  )}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Insurance</span>
                <span className="font-medium">
                  {formatCurrency(
                    incomeStatementData.operatingExpenses.insurance
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Depreciation</span>
                <span className="font-medium">
                  {formatCurrency(
                    incomeStatementData.operatingExpenses.depreciation
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Other Expenses</span>
                <span className="font-medium">
                  {formatCurrency(incomeStatementData.operatingExpenses.other)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between font-bold">
                  <span>Total Operating Expenses</span>
                  <span className="text-red-600">
                    {formatCurrency(
                      incomeStatementData.operatingExpenses
                        .totalOperatingExpenses
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Income and Expenses */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingUp className="h-5 w-5 text-green-600" />
              Other Income
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Interest Income</span>
              <span className="font-medium text-green-600">
                +{formatCurrency(incomeStatementData.otherIncome.interest)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Gains</span>
              <span className="font-medium text-green-600">
                +{formatCurrency(incomeStatementData.otherIncome.gains)}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center justify-between font-bold">
                <span>Total Other Income</span>
                <span className="text-green-600">
                  +
                  {formatCurrency(
                    incomeStatementData.otherIncome.totalOtherIncome
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingDown className="h-5 w-5 text-red-600" />
              Other Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Interest Expense</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(incomeStatementData.otherExpenses.interest)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Losses</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(incomeStatementData.otherExpenses.losses)}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center justify-between font-bold">
                <span>Total Other Expenses</span>
                <span className="text-red-600">
                  -
                  {formatCurrency(
                    incomeStatementData.otherExpenses.totalOtherExpenses
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Income Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Net Income Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(incomeStatementData.revenue.totalRevenue)}
                </div>
                <div className="text-sm text-green-600">Total Revenue</div>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(
                    incomeStatementData.costOfGoodsSold.totalCOGS
                  )}
                </div>
                <div className="text-sm text-red-600">Cost of Goods Sold</div>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <div
                  className={`text-2xl font-bold ${
                    incomeStatementData.grossProfit >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(incomeStatementData.grossProfit)}
                </div>
                <div className="text-sm text-blue-600">Gross Profit</div>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 text-center">
                <div
                  className={`text-2xl font-bold ${
                    incomeStatementData.netIncome >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(incomeStatementData.netIncome)}
                </div>
                <div className="text-sm text-purple-600">Net Income</div>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold">Income Statement Analysis</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Gross Profit Margin:</strong>{' '}
                  {(
                    (incomeStatementData.grossProfit /
                      incomeStatementData.revenue.totalRevenue) *
                    100
                  ).toFixed(1)}
                  % -{' '}
                  {incomeStatementData.grossProfit >= 0
                    ? 'Healthy'
                    : 'Concerning'}{' '}
                  profit margin.
                </p>
                <p>
                  <strong>Operating Margin:</strong>{' '}
                  {(
                    (incomeStatementData.operatingIncome /
                      incomeStatementData.revenue.totalRevenue) *
                    100
                  ).toFixed(1)}
                  % -{' '}
                  {incomeStatementData.operatingIncome >= 0
                    ? 'Positive'
                    : 'Negative'}{' '}
                  operating performance.
                </p>
                <p>
                  <strong>Net Profit Margin:</strong>{' '}
                  {(
                    (incomeStatementData.netIncome /
                      incomeStatementData.revenue.totalRevenue) *
                    100
                  ).toFixed(1)}
                  % -{' '}
                  {incomeStatementData.netIncome >= 0
                    ? 'Profitable'
                    : 'Loss-making'}{' '}
                  business.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
