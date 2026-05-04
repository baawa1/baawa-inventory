'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppUser } from '@/types/user';
import { useFinancialReports } from '@/hooks/api/finance';
import { formatCurrency } from '@/lib/utils';
import { exportToCSV, generateExportFilename } from '@/lib/utils/finance';
import { toast } from 'sonner';
import { formatFinanceDateInput } from '@/lib/finance/date-range';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { InlineLoading } from '@/components/ui/loading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Icons
import {
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

interface ReportsListProps {
  user: AppUser;
}

export function ReportsList({ user: _user }: ReportsListProps) {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [reportType, setReportType] = useState('FINANCIAL_SUMMARY');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return formatFinanceDateInput(d);
  });
  const [endDate, setEndDate] = useState(() =>
    formatFinanceDateInput(new Date())
  );
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: reportsData,
    isLoading,
    error,
    refetch,
  } = useFinancialReports({
    period,
    type: 'all',
    dateFrom: startDate,
    dateTo: endDate,
  });

  const summary = reportsData?.data?.summary;
  const profitLoss = reportsData?.data?.profitLoss;

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setIsExporting(true);
    try {
      // Export the current report data as CSV
      const exportData = [];

      if (reportType === 'FINANCIAL_SUMMARY' || reportType === 'INCOME_STATEMENT') {
        exportData.push(
          { Category: 'REVENUE', Item: 'Sales', Amount: profitLoss?.revenue?.sales || 0 },
          { Category: 'REVENUE', Item: 'Other Operating Income', Amount: profitLoss?.revenue?.otherIncome || 0 },
          { Category: 'REVENUE', Item: 'Total Revenue', Amount: profitLoss?.revenue?.totalRevenue || 0 },
          { Category: '---', Item: '---', Amount: '---' },
          { Category: 'EXPENSES', Item: 'Cost of Goods', Amount: profitLoss?.expenses?.costOfGoods || 0 },
          { Category: 'EXPENSES', Item: 'Operating Expenses', Amount: profitLoss?.expenses?.operatingExpenses || 0 },
          { Category: 'EXPENSES', Item: 'Total Expenses', Amount: profitLoss?.expenses?.totalExpenses || 0 },
          { Category: '---', Item: '---', Amount: '---' },
          { Category: 'PROFIT', Item: 'Gross Profit', Amount: profitLoss?.grossProfit || 0 },
          { Category: 'PROFIT', Item: 'Net Profit', Amount: profitLoss?.netProfit || 0 }
        );
      }

      if (reportType === 'EXPENSE_REPORT') {
        exportData.push(
          { Category: 'EXPENSES', Item: 'Cost of Goods', Amount: profitLoss?.expenses?.costOfGoods || 0 },
          { Category: 'EXPENSES', Item: 'Operating Expenses', Amount: profitLoss?.expenses?.operatingExpenses || 0 },
          { Category: 'EXPENSES', Item: 'Total Expenses', Amount: profitLoss?.expenses?.totalExpenses || 0 }
        );
      }

      if (reportType === 'CASH_FLOW') {
        const cashFlow = reportsData?.data?.cashFlow;
        exportData.push(
          { Category: 'OPERATING', Item: 'Net Income', Amount: cashFlow?.operatingActivities?.netIncome || 0 },
          { Category: 'OPERATING', Item: 'Net Operating Cash Flow', Amount: cashFlow?.operatingActivities?.netOperatingCashFlow || 0 },
          { Category: 'INVESTING', Item: 'Capital Expenditures', Amount: cashFlow?.investingActivities?.capitalExpenditures || 0 },
          { Category: 'INVESTING', Item: 'Net Investing Cash Flow', Amount: cashFlow?.investingActivities?.netInvestingCashFlow || 0 },
          { Category: 'FINANCING', Item: 'Financing Inflows', Amount: cashFlow?.financingActivities?.loans || 0 },
          { Category: 'FINANCING', Item: 'Repayments', Amount: cashFlow?.financingActivities?.repayments || 0 },
          { Category: 'FINANCING', Item: 'Net Financing Cash Flow', Amount: cashFlow?.financingActivities?.netFinancingCashFlow || 0 },
          { Category: '---', Item: '---', Amount: '---' },
          { Category: 'TOTAL', Item: 'Total Cash Flow', Amount: reportsData?.data?.totalCashFlow || 0 }
        );
      }

      const filename = generateExportFilename('financial-report', reportType.toLowerCase().replace('_', '-'));
      exportToCSV(exportData as any, filename);
      toast.success(`${getReportTypeLabel(reportType)} exported successfully`);
      setIsGenerateDialogOpen(false);
    } catch (err) {
      console.error('Error exporting report:', err);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'FINANCIAL_SUMMARY':
        return 'Financial Summary';
      case 'INCOME_STATEMENT':
        return 'Income Statement';
      case 'EXPENSE_REPORT':
        return 'Expense Report';
      case 'CASH_FLOW':
        return 'Cash Flow';
      default:
        return type;
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-destructive">
                Failed to load financial reports
              </p>
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Financial Reports"
          description="View and generate financial reports and analytics"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            isLoading={isLoading}
            loadingText="Refreshing..."
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog
            open={isGenerateDialogOpen}
            onOpenChange={setIsGenerateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Export Financial Report</DialogTitle>
                <DialogDescription>
                  Select the report type and date range to export a financial report.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FINANCIAL_SUMMARY">
                        Financial Summary
                      </SelectItem>
                      <SelectItem value="INCOME_STATEMENT">
                        Income Statement
                      </SelectItem>
                      <SelectItem value="EXPENSE_REPORT">
                        Expense Report
                      </SelectItem>
                      <SelectItem value="CASH_FLOW">Cash Flow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="period">Period</Label>
                  <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsGenerateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  disabled={isExporting || isLoading}
                >
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Report Cards - Link to actual report pages */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Link href="/finance/reports/income-statement">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? '...' : formatCurrency(profitLoss?.revenue?.totalRevenue || 0)}
              </div>
              <p className="text-muted-foreground text-xs">
                View income statement
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/finance/reports/expenses">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {isLoading ? '...' : formatCurrency(profitLoss?.expenses?.totalExpenses || 0)}
              </div>
              <p className="text-muted-foreground text-xs">
                View expense breakdown
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/finance/reports/cash-flow">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <TrendingUp className={`h-4 w-4 ${(profitLoss?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(profitLoss?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {isLoading ? '...' : formatCurrency(profitLoss?.netProfit || 0)}
              </div>
              <p className="text-muted-foreground text-xs">
                View cash flow
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? '...' : summary?.totalTransactions || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              Total this period
            </p>
          </CardContent>
        </Card>

        <Link href="/finance/reports/analytics">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Analytics Dashboard
              </CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">Analytics</div>
              <p className="text-muted-foreground text-xs">
                Comprehensive analytics
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/finance/reports/overlap-audit">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Overlap Audit
              </CardTitle>
              <ShieldAlert className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">Audit</div>
              <p className="text-muted-foreground text-xs">
                Review excluded legacy entries
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Period Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Period Summary</CardTitle>
          <CardDescription>
            Financial overview for the selected period ({period})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <InlineLoading label="Loading reports..." />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profit & Loss Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold">Profit & Loss</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sales Revenue</span>
                    <span className="font-medium">{formatCurrency(profitLoss?.revenue?.sales || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Other Operating Income</span>
                    <span className="font-medium">{formatCurrency(profitLoss?.revenue?.otherIncome || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Revenue</span>
                    <span className="font-bold text-green-600">{formatCurrency(profitLoss?.revenue?.totalRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost of Goods</span>
                    <span className="font-medium">{formatCurrency(profitLoss?.expenses?.costOfGoods || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operating Expenses</span>
                    <span className="font-medium">{formatCurrency(profitLoss?.expenses?.operatingExpenses || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Expenses</span>
                    <span className="font-bold text-red-600">{formatCurrency(profitLoss?.expenses?.totalExpenses || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Gross Profit</span>
                    <span className="font-bold">{formatCurrency(profitLoss?.grossProfit || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-lg font-bold">Net Profit</span>
                    <span className={`text-lg font-bold ${(profitLoss?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profitLoss?.netProfit || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <h3 className="font-semibold">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(summary?.totalIncome || 0)}</div>
                    <div className="text-xs text-green-600">Operating Revenue</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
                    <div className="text-lg font-bold text-red-600">{formatCurrency(summary?.totalExpenses || 0)}</div>
                    <div className="text-xs text-red-600">Total Expenses</div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/20">
                    <div className="text-lg font-bold text-blue-600">{summary?.totalTransactions || 0}</div>
                    <div className="text-xs text-blue-600">Transactions</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center ${(summary?.netProfit || 0) >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <div className={`text-lg font-bold ${(summary?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(summary?.netProfit || 0)}
                    </div>
                    <div className={`text-xs ${(summary?.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {(summary?.netProfit || 0) >= 0 ? 'Profit' : 'Loss'}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href="/finance/income" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      View Income
                    </Button>
                  </Link>
                  <Link href="/finance/expenses" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      View Expenses
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
