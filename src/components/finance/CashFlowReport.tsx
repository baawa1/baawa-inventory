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
  IconArrowDownRight,
  IconArrowUpRight,
} from '@tabler/icons-react';
import { CashFlowForecastDashboard } from './dashboards/CashFlowForecastDashboard';
import { formatFinanceDateInput } from '@/lib/finance/date-range';

interface CashFlowReportProps {
  user: AppUser;
}

export function CashFlowReport({ user: _user }: CashFlowReportProps) {
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

  const cashFlow = reportsData?.data?.cashFlow;
  const totalCashFlow = reportsData?.data?.totalCashFlow || 0;

  const exportRows = useMemo(
    () => [
      {
        Section: 'Operating Activities',
        Item: 'Net Income',
        Amount: cashFlow?.operatingActivities?.netIncome || 0,
      },
      {
        Section: 'Operating Activities',
        Item: 'Operating Revenue',
        Amount: cashFlow?.operatingActivities?.operatingRevenue || 0,
      },
      {
        Section: 'Operating Activities',
        Item: 'Operating Expenses',
        Amount: cashFlow?.operatingActivities?.operatingExpenses || 0,
      },
      {
        Section: 'Operating Activities',
        Item: 'Net Operating Cash Flow',
        Amount: cashFlow?.operatingActivities?.netOperatingCashFlow || 0,
      },
      {
        Section: 'Investing Activities',
        Item: 'Capital Expenditures',
        Amount: cashFlow?.investingActivities?.capitalExpenditures || 0,
      },
      {
        Section: 'Investing Activities',
        Item: 'Net Investing Cash Flow',
        Amount: cashFlow?.investingActivities?.netInvestingCashFlow || 0,
      },
      {
        Section: 'Financing Activities',
        Item: 'Financing Inflows',
        Amount: cashFlow?.financingActivities?.loans || 0,
      },
      {
        Section: 'Financing Activities',
        Item: 'Net Financing Cash Flow',
        Amount: cashFlow?.financingActivities?.netFinancingCashFlow || 0,
      },
      {
        Section: 'Summary',
        Item: 'Total Cash Flow',
        Amount: totalCashFlow,
      },
    ],
    [cashFlow, totalCashFlow]
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <InlineLoading className="justify-center" label="Loading cash flow..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load cash flow report.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleExport = () => {
    exportToCSV(exportRows, generateExportFilename('cash-flow-report', period));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Cash Flow"
          description="Live cash flow reporting with forecast projections from unified finance data"
        />
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Select cash flow range"
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
        <SummaryCard
          title="Operating Cash Flow"
          amount={cashFlow?.operatingActivities?.netOperatingCashFlow || 0}
        />
        <SummaryCard
          title="Investing Cash Flow"
          amount={cashFlow?.investingActivities?.netInvestingCashFlow || 0}
        />
        <SummaryCard
          title="Financing Cash Flow"
          amount={cashFlow?.financingActivities?.netFinancingCashFlow || 0}
        />
        <SummaryCard title="Total Cash Flow" amount={totalCashFlow} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Statement</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-3">
          <CashFlowSection
            title="Operating Activities"
            rows={[
              ['Net Income', cashFlow?.operatingActivities?.netIncome || 0],
              [
                'Operating Revenue',
                cashFlow?.operatingActivities?.operatingRevenue || 0,
              ],
              [
                'Operating Expenses',
                -(cashFlow?.operatingActivities?.operatingExpenses || 0),
              ],
              [
                'Net Operating Cash Flow',
                cashFlow?.operatingActivities?.netOperatingCashFlow || 0,
              ],
            ]}
          />
          <CashFlowSection
            title="Investing Activities"
            rows={[
              [
                'Capital Expenditures',
                -(cashFlow?.investingActivities?.capitalExpenditures || 0),
              ],
              [
                'Net Investing Cash Flow',
                cashFlow?.investingActivities?.netInvestingCashFlow || 0,
              ],
            ]}
          />
          <CashFlowSection
            title="Financing Activities"
            rows={[
              ['Financing Inflows', cashFlow?.financingActivities?.loans || 0],
              [
                'Net Financing Cash Flow',
                cashFlow?.financingActivities?.netFinancingCashFlow || 0,
              ],
            ]}
          />
        </CardContent>
      </Card>

      <CashFlowForecastDashboard />
    </div>
  );
}

function SummaryCard({ title, amount }: { title: string; amount: number }) {
  const positive = amount >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${
            positive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatCurrency(amount)}
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          {positive ? (
            <IconArrowUpRight className="h-3 w-3 text-green-600" />
          ) : (
            <IconArrowDownRight className="h-3 w-3 text-red-600" />
          )}
          {positive ? 'Positive movement' : 'Negative movement'}
        </div>
      </CardContent>
    </Card>
  );
}

function CashFlowSection({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, number]>;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="space-y-2">
        {rows.map(([label, amount]) => (
          <div key={label} className="flex justify-between">
            <span>{label}</span>
            <span className={amount >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
