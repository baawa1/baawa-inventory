'use client';

import React, { useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { AppUser } from '@/types/user';
import { useFinancialReports } from '@/hooks/api/finance';
import { formatCurrency } from '@/lib/utils';
import {
  exportToCSV,
  generateExportFilename,
} from '@/lib/utils/finance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineLoading } from '@/components/ui/loading';
import { PageHeader } from '@/components/ui/page-header';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
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
  IconRefresh,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react';
import { formatFinanceDateInput } from '@/lib/finance/date-range';

interface IncomeStatementReportProps {
  user: AppUser;
}

export function IncomeStatementReport({
  user: _user,
}: IncomeStatementReportProps) {
  const [period, setPeriod] = useState<
    'weekly' | 'monthly' | 'quarterly' | 'yearly'
  >('monthly');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const {
    data: reportsData,
    isLoading,
    error,
    refetch,
  } = useFinancialReports({
    period,
    type: 'all',
    dateFrom: dateRange?.from
      ? formatFinanceDateInput(dateRange.from)
      : undefined,
    dateTo: dateRange?.to ? formatFinanceDateInput(dateRange.to) : undefined,
  });

  const profitLoss = reportsData?.data?.profitLoss;

  const exportRows = useMemo(
    () => [
      {
        Section: 'Revenue',
        Item: 'Sales Revenue',
        Amount: profitLoss?.revenue?.sales || 0,
      },
      {
        Section: 'Revenue',
        Item: 'Other Operating Income',
        Amount: profitLoss?.revenue?.otherIncome || 0,
      },
      {
        Section: 'Revenue',
        Item: 'Total Revenue',
        Amount: profitLoss?.revenue?.totalRevenue || 0,
      },
      {
        Section: 'Expenses',
        Item: 'Cost Of Goods',
        Amount: profitLoss?.expenses?.costOfGoods || 0,
      },
      {
        Section: 'Expenses',
        Item: 'Operating Expenses',
        Amount: profitLoss?.expenses?.operatingExpenses || 0,
      },
      {
        Section: 'Expenses',
        Item: 'Total Expenses',
        Amount: profitLoss?.expenses?.totalExpenses || 0,
      },
      {
        Section: 'Profit',
        Item: 'Gross Profit',
        Amount: profitLoss?.grossProfit || 0,
      },
      {
        Section: 'Profit',
        Item: 'Net Profit',
        Amount: profitLoss?.netProfit || 0,
      },
    ],
    [profitLoss]
  );

  const handleExport = () => {
    exportToCSV(
      exportRows,
      generateExportFilename('income-statement', period)
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <InlineLoading className="justify-center" label="Loading income statement..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load income statement.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRevenue = profitLoss?.revenue?.totalRevenue || 0;
  const totalExpenses = profitLoss?.expenses?.totalExpenses || 0;
  const grossProfit = profitLoss?.grossProfit || 0;
  const netProfit = profitLoss?.netProfit || 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Income Statement"
          description="Live profit and loss reporting across manual finance, POS sales, and stock purchases"
        />
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Select statement range"
          />
          <Select value={period} onValueChange={value => setPeriod(value as typeof period)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <IconDownload className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <IconPrinter className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(grossProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(netProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income Statement Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <IconTrendingUp className="h-4 w-4 text-green-600" />
              Revenue
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Sales Revenue</span>
                <span>{formatCurrency(profitLoss?.revenue?.sales || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Operating Income</span>
                <span>{formatCurrency(profitLoss?.revenue?.otherIncome || 0)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total Revenue</span>
                <span>{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <IconTrendingDown className="h-4 w-4 text-red-600" />
              Expenses
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Cost Of Goods</span>
                <span>{formatCurrency(profitLoss?.expenses?.costOfGoods || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Operating Expenses</span>
                <span>{formatCurrency(profitLoss?.expenses?.operatingExpenses || 0)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total Expenses</span>
                <span>{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Gross Profit</span>
              <span>{formatCurrency(grossProfit)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Net Profit</span>
              <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
