'use client';

import React, { useState } from 'react';
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
  IconCash,
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
  IconRefresh,
} from '@tabler/icons-react';
import { DateRange } from 'react-day-picker';
import { formatCurrency } from '@/lib/utils';
import { useFinancialAnalytics } from '@/hooks/api/useFinancialAnalytics';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { AppUser } from '@/types/user';

interface CashFlowReportProps {
  user: AppUser;
}

export function CashFlowReport({ user }: CashFlowReportProps) {
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

  // Calculate cash flow data
  const cashFlowData = {
    operatingActivities: {
      netIncome: summary?.netProfit || 0,
      depreciation: 15000,
      changesInWorkingCapital: -25000,
      accountsReceivable: -15000,
      accountsPayable: 20000,
      inventory: -10000,
      netOperatingCashFlow: (summary?.netProfit || 0) + 15000 - 25000,
    },
    investingActivities: {
      capitalExpenditures: -50000,
      investments: -30000,
      assetSales: 10000,
      netInvestingCashFlow: -70000,
    },
    financingActivities: {
      loans: 100000,
      repayments: -20000,
      dividends: -15000,
      netFinancingCashFlow: 65000,
    },
  };

  const totalCashFlow =
    cashFlowData.operatingActivities.netOperatingCashFlow +
    cashFlowData.investingActivities.netInvestingCashFlow +
    cashFlowData.financingActivities.netFinancingCashFlow;

  const handleExportReport = () => {
    console.log('Exporting cash flow report...');
  };

  const handlePrintReport = () => {
    console.log('Printing cash flow report...');
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
            Loading cash flow data...
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
            Cash Flow Report
          </h1>
          <p className="text-muted-foreground">
            Comprehensive cash flow analysis and statement
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
            placeholder="Select date range for cash flow analysis"
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Operating Cash Flow
            </CardTitle>
            <IconCash className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                cashFlowData.operatingActivities.netOperatingCashFlow >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatCurrency(
                cashFlowData.operatingActivities.netOperatingCashFlow
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Net cash from operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Investing Cash Flow
            </CardTitle>
            <IconTrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(
                cashFlowData.investingActivities.netInvestingCashFlow
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Net cash from investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Financing Cash Flow
            </CardTitle>
            <IconTrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                cashFlowData.financingActivities.netFinancingCashFlow
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Net cash from financing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
            <IconCash className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(totalCashFlow)}
            </div>
            <p className="text-muted-foreground text-xs">
              Total change in cash
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Cash Flow Statement */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Operating Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCash className="h-5 w-5 text-blue-600" />
              Operating Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Net Income</span>
                <span className="font-medium">
                  {formatCurrency(cashFlowData.operatingActivities.netIncome)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Depreciation</span>
                <span className="font-medium text-green-600">
                  +
                  {formatCurrency(
                    cashFlowData.operatingActivities.depreciation
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Accounts Receivable</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(
                    cashFlowData.operatingActivities.accountsReceivable
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Accounts Payable</span>
                <span className="font-medium text-green-600">
                  +
                  {formatCurrency(
                    cashFlowData.operatingActivities.accountsPayable
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Inventory</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(cashFlowData.operatingActivities.inventory)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between font-bold">
                  <span>Net Operating Cash Flow</span>
                  <span
                    className={
                      cashFlowData.operatingActivities.netOperatingCashFlow >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {formatCurrency(
                      cashFlowData.operatingActivities.netOperatingCashFlow
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investing Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingDown className="h-5 w-5 text-orange-600" />
              Investing Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Capital Expenditures</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(
                    cashFlowData.investingActivities.capitalExpenditures
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Investments</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(cashFlowData.investingActivities.investments)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Asset Sales</span>
                <span className="font-medium text-green-600">
                  +{formatCurrency(cashFlowData.investingActivities.assetSales)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between font-bold">
                  <span>Net Investing Cash Flow</span>
                  <span className="text-red-600">
                    {formatCurrency(
                      cashFlowData.investingActivities.netInvestingCashFlow
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financing Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTrendingUp className="h-5 w-5 text-purple-600" />
              Financing Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Loans</span>
                <span className="font-medium text-green-600">
                  +{formatCurrency(cashFlowData.financingActivities.loans)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Repayments</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(cashFlowData.financingActivities.repayments)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Dividends</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(cashFlowData.financingActivities.dividends)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between font-bold">
                  <span>Net Financing Cash Flow</span>
                  <span className="text-green-600">
                    {formatCurrency(
                      cashFlowData.financingActivities.netFinancingCashFlow
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    cashFlowData.operatingActivities.netOperatingCashFlow
                  )}
                </div>
                <div className="text-sm text-blue-600">Operating</div>
              </div>
              <div className="rounded-lg bg-orange-50 p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(
                    cashFlowData.investingActivities.netInvestingCashFlow
                  )}
                </div>
                <div className="text-sm text-orange-600">Investing</div>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    cashFlowData.financingActivities.netFinancingCashFlow
                  )}
                </div>
                <div className="text-sm text-purple-600">Financing</div>
              </div>
              <div className="rounded-lg bg-indigo-50 p-4 text-center">
                <div
                  className={`text-2xl font-bold ${
                    totalCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(totalCashFlow)}
                </div>
                <div className="text-sm text-indigo-600">Net Change</div>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold">Cash Flow Analysis</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Operating Cash Flow:</strong>{' '}
                  {totalCashFlow >= 0 ? 'Positive' : 'Negative'} operating cash
                  flow indicates {totalCashFlow >= 0 ? 'strong' : 'weak'}{' '}
                  operational performance.
                </p>
                <p>
                  <strong>Investing Activities:</strong>{' '}
                  {cashFlowData.investingActivities.netInvestingCashFlow < 0
                    ? 'Net outflow'
                    : 'Net inflow'}{' '}
                  shows{' '}
                  {cashFlowData.investingActivities.netInvestingCashFlow < 0
                    ? 'investment in assets'
                    : 'asset sales'}
                  .
                </p>
                <p>
                  <strong>Financing Activities:</strong>{' '}
                  {cashFlowData.financingActivities.netFinancingCashFlow >= 0
                    ? 'Net inflow'
                    : 'Net outflow'}{' '}
                  indicates{' '}
                  {cashFlowData.financingActivities.netFinancingCashFlow >= 0
                    ? 'new financing'
                    : 'debt repayment'}
                  .
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
