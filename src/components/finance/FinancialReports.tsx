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
import { logger } from '@/lib/logger';
import { useFinancialReports } from '@/hooks/api/finance';

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

  const { data: reportsData, isLoading: reportsLoading } = useFinancialReports({
    period: period as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    type: transactionType as 'all' | 'income' | 'expense',
    paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
  });

  const isLoading = reportsLoading;

  // Use real API data instead of mock data
  const profitLossData = reportsData?.data?.profitLoss || {
    revenue: {
      sales: 0,
      otherIncome: 0,
      totalRevenue: 0,
    },
    expenses: {
      costOfGoods: 0,
      operatingExpenses: 0,
      totalExpenses: 0,
    },
    grossProfit: 0,
    netProfit: 0,
  };

  const cashFlowData = reportsData?.data?.cashFlow || {
    operatingActivities: {
      netIncome: 0,
      depreciation: 0,
      changesInWorkingCapital: 0,
      netOperatingCashFlow: 0,
    },
    investingActivities: {
      capitalExpenditures: 0,
      investments: 0,
      netInvestingCashFlow: 0,
    },
    financingActivities: {
      loans: 0,
      repayments: 0,
      netFinancingCashFlow: 0,
    },
  };

  const handleExportReport = (type: string) => {
    // Implementation for exporting reports
    logger.info('Exporting financial report', { type });
  };

  const handlePrintReport = (type: string) => {
    // Implementation for printing reports
    logger.info('Printing financial report', { type });
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
                  {formatCurrency(profitLossData.revenue.totalRevenue)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  +0% from last period
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
                  {formatCurrency(profitLossData.expenses.totalExpenses)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  +0% from last period
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
                  className={`text-2xl font-bold ${profitLossData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(profitLossData.netProfit)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {profitLossData.netProfit >= 0 ? 'Profit' : 'Loss'}
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
                <div className="text-2xl font-bold">{0}</div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Average: {formatCurrency(0)}
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
                <div className="text-2xl font-bold capitalize">Cash</div>
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
