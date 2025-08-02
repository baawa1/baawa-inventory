'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  IconChartBar,
  IconTrendingUp,
  IconCash,
} from '@tabler/icons-react';
import { DateRange } from 'react-day-picker';
import { formatCurrency } from '@/lib/utils';
import { useFinancialAnalytics } from '@/hooks/api/useFinancialAnalytics';

interface FinancialReportsProps {
  dateRange?: DateRange;
  transactionType?: string;
  paymentMethod?: string;
}

export function FinancialReports({
  dateRange,
  transactionType,
  paymentMethod,
}: FinancialReportsProps) {
  const [reportType, setReportType] = useState('profit-loss');
  const [period, setPeriod] = useState('monthly');

  const { data: analyticsData, isLoading } = useFinancialAnalytics({
    dateRange,
    type: transactionType as 'all' | 'income' | 'expense',
    paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
  });

  const summary = analyticsData?.summary;

  // Mock data for demonstration - replace with real API data
  const profitLossData = {
    revenue: {
      sales: summary?.totalRevenue || 0,
      otherIncome: 50000,
      totalRevenue: (summary?.totalRevenue || 0) + 50000,
    },
    expenses: {
      costOfGoods: (summary?.totalExpenses || 0) * 0.6,
      operatingExpenses: (summary?.totalExpenses || 0) * 0.4,
      totalExpenses: summary?.totalExpenses || 0,
    },
    grossProfit:
      (summary?.totalRevenue || 0) - (summary?.totalExpenses || 0) * 0.6,
    netProfit: summary?.netProfit || 0,
  };

  const cashFlowData = {
    operatingActivities: {
      netIncome: summary?.netProfit || 0,
      depreciation: 15000,
      changesInWorkingCapital: -25000,
      netOperatingCashFlow: (summary?.netProfit || 0) + 15000 - 25000,
    },
    investingActivities: {
      capitalExpenditures: -50000,
      investments: -30000,
      netInvestingCashFlow: -80000,
    },
    financingActivities: {
      loans: 100000,
      repayments: -20000,
      netFinancingCashFlow: 80000,
    },
  };

  const handleExportReport = (type: string) => {
    // Implementation for exporting reports
    console.log(`Exporting ${type} report...`);
  };

  const handlePrintReport = (type: string) => {
    // Implementation for printing reports
    console.log(`Printing ${type} report...`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="py-8 text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin border-b-2"></div>
          <p className="text-muted-foreground mt-2">
            Loading financial reports...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive financial analysis and reporting
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
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs
        value={reportType}
        onValueChange={setReportType}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profit-loss" className="flex items-center gap-2">
            <IconTrendingUp className="h-4 w-4" />
            Profit & Loss
          </TabsTrigger>
          <TabsTrigger value="cash-flow" className="flex items-center gap-2">
            <IconCash className="h-4 w-4" />
            Cash Flow
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <IconChartBar className="h-4 w-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Profit & Loss Statement */}
        <TabsContent value="profit-loss" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Profit & Loss Statement
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleExportReport('profit-loss')}
                    variant="outline"
                    size="sm"
                  >
                    <IconDownload className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button
                    onClick={() => handlePrintReport('profit-loss')}
                    variant="outline"
                    size="sm"
                  >
                    <IconPrinter className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Section */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold">Revenue</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Sales Revenue</span>
                      <span className="font-medium">
                        {formatCurrency(profitLossData.revenue.sales)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Other Income</span>
                      <span className="font-medium">
                        {formatCurrency(profitLossData.revenue.otherIncome)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-semibold">Total Revenue</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(profitLossData.revenue.totalRevenue)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold">Expenses</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Cost of Goods Sold</span>
                      <span className="font-medium">
                        {formatCurrency(profitLossData.expenses.costOfGoods)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Operating Expenses</span>
                      <span className="font-medium">
                        {formatCurrency(
                          profitLossData.expenses.operatingExpenses
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-semibold">Total Expenses</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(profitLossData.expenses.totalExpenses)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profit Section */}
                <div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Gross Profit</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(profitLossData.grossProfit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-lg font-bold">Net Profit</span>
                      <span
                        className={`text-lg font-bold ${profitLossData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {formatCurrency(profitLossData.netProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Statement */}
        <TabsContent value="cash-flow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Cash Flow Statement
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleExportReport('cash-flow')}
                    variant="outline"
                    size="sm"
                  >
                    <IconDownload className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button
                    onClick={() => handlePrintReport('cash-flow')}
                    variant="outline"
                    size="sm"
                  >
                    <IconPrinter className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Operating Activities */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold">
                    Operating Activities
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Net Income</span>
                      <span className="font-medium">
                        {formatCurrency(
                          cashFlowData.operatingActivities.netIncome
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Depreciation</span>
                      <span className="font-medium">
                        {formatCurrency(
                          cashFlowData.operatingActivities.depreciation
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Changes in Working Capital</span>
                      <span className="font-medium">
                        {formatCurrency(
                          cashFlowData.operatingActivities
                            .changesInWorkingCapital
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-semibold">
                        Net Operating Cash Flow
                      </span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(
                          cashFlowData.operatingActivities.netOperatingCashFlow
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Investing Activities */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold">
                    Investing Activities
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Capital Expenditures</span>
                      <span className="font-medium">
                        {formatCurrency(
                          cashFlowData.investingActivities.capitalExpenditures
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Investments</span>
                      <span className="font-medium">
                        {formatCurrency(
                          cashFlowData.investingActivities.investments
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-semibold">
                        Net Investing Cash Flow
                      </span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(
                          cashFlowData.investingActivities.netInvestingCashFlow
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financing Activities */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold">
                    Financing Activities
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Loans</span>
                      <span className="font-medium">
                        {formatCurrency(cashFlowData.financingActivities.loans)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Repayments</span>
                      <span className="font-medium">
                        {formatCurrency(
                          cashFlowData.financingActivities.repayments
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-semibold">
                        Net Financing Cash Flow
                      </span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(
                          cashFlowData.financingActivities.netFinancingCashFlow
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Summary */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary?.totalRevenue || 0)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  +{summary?.revenueGrowth || 0}% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary?.totalExpenses || 0)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  +{summary?.expenseGrowth || 0}% from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Net Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(summary?.netProfit || 0)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {(summary?.netProfit || 0) >= 0 ? 'Profit' : 'Loss'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Total Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(summary?.totalTransactions || 0).toLocaleString()}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Average:{' '}
                  {formatCurrency(summary?.averageTransactionValue || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Top Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {summary?.topPaymentMethod || 'Cash'}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Most used payment method
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Report Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {dateRange?.from && dateRange?.to
                    ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                    : 'Custom range'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
