'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import type { AppUser } from '@/types/user';
import {
  useFinancialReports,
  useGenerateFinancialReport,
} from '@/hooks/api/finance';
import { formatCurrency } from '@/lib/utils';
import {
  exportToCSV,
  generateExportFilename,
} from '@/lib/utils/finance';
import { formatFinanceDateInput } from '@/lib/finance/date-range';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineLoading } from '@/components/ui/loading';
import { PageHeader } from '@/components/ui/page-header';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
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
  IconRefresh,
  IconTrendingDown,
  IconTrendingUp,
  IconDeviceFloppy,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { toast } from 'sonner';

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

  const queryParams = {
    period,
    type: 'all' as const,
    dateFrom: dateRange?.from
      ? formatFinanceDateInput(dateRange.from)
      : undefined,
    dateTo: dateRange?.to ? formatFinanceDateInput(dateRange.to) : undefined,
  };

  const {
    data: reportsData,
    isLoading,
    error,
    refetch,
  } = useFinancialReports(queryParams);
  const generateReport = useGenerateFinancialReport();

  const report = reportsData?.data;

  const handleExport = async () => {
    try {
      const response = await generateReport.mutateAsync({
        reportType: 'INCOME_STATEMENT',
        period,
        dateFrom: queryParams.dateFrom,
        dateTo: queryParams.dateTo,
        saveSnapshot: false,
      });

      exportToCSV(
        response.data.report.exportRows,
        generateExportFilename('income-statement', period)
      );
      toast.success('Income statement exported');
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to export income statement'
      );
    }
  };

  const handleSaveSnapshot = async () => {
    try {
      const response = await generateReport.mutateAsync({
        reportType: 'INCOME_STATEMENT',
        period,
        dateFrom: queryParams.dateFrom,
        dateTo: queryParams.dateTo,
        saveSnapshot: true,
      });

      toast.success(
        response.data.snapshot
          ? 'Income statement snapshot saved'
          : 'Income statement generated'
      );
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to save income statement snapshot'
      );
    }
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

  if (error || !report) {
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

  const statement = report.incomeStatement;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Income Statement"
          description="Trading profit view based on recognised sales income, sold goods cost, and operating expenses."
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
          <Button
            variant="outline"
            onClick={handleSaveSnapshot}
            isLoading={generateReport.isPending}
            loadingText="Saving..."
          >
            <IconDeviceFloppy className="mr-2 h-4 w-4" />
            Save Snapshot
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <IconPrinter className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{period}</Badge>
        <Badge variant={report.methodology.status === 'exact' ? 'default' : 'secondary'}>
          {report.methodology.status}
        </Badge>
      </div>

      {report.methodology.estimated ? (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-900">
            <IconAlertTriangle className="mt-0.5 h-4 w-4" />
            <div className="space-y-1">
              {report.methodology.reasons.map(reason => (
                <div key={reason}>{reason}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Sales Revenue"
          amount={statement.salesRevenueRecognised}
          accent="text-green-600"
        />
        <SummaryCard
          title="Other Operating Income"
          amount={statement.otherOperatingIncome}
          accent="text-emerald-600"
        />
        <SummaryCard
          title="Gross Profit"
          amount={statement.grossProfit}
          accent={statement.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <SummaryCard
          title="Net Profit"
          amount={statement.netProfit}
          accent={statement.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income Statement Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <IconTrendingUp className="h-4 w-4 text-green-600" />
              Income
            </div>
            <StatementRow
              label="Sales Revenue Recognised"
              amount={statement.salesRevenueRecognised}
            />
            <StatementRow
              label="Other Operating Income"
              amount={statement.otherOperatingIncome}
            />
            <StatementRow
              label="Total Operating Income"
              amount={statement.totalOperatingIncome}
              strong
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <IconTrendingDown className="h-4 w-4 text-red-600" />
              Costs And Profit
            </div>
            <StatementRow
              label="Cost Of Goods Sold"
              amount={statement.costOfGoodsSold}
              negative
            />
            <StatementRow
              label="Gross Profit"
              amount={statement.grossProfit}
              strong
            />
            <StatementRow
              label="Operating Expenses"
              amount={statement.operatingExpenses}
              negative
            />
            <StatementRow
              label="Net Profit"
              amount={statement.netProfit}
              strong
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  amount,
  accent,
}: {
  title: string;
  amount: number;
  accent: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent}`}>
          {formatCurrency(amount)}
        </div>
      </CardContent>
    </Card>
  );
}

function StatementRow({
  label,
  amount,
  negative = false,
  strong = false,
}: {
  label: string;
  amount: number;
  negative?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${strong ? 'border-t pt-2 font-semibold' : ''}`}
    >
      <span>{label}</span>
      <span>
        {negative ? '-' : ''}
        {formatCurrency(Math.abs(amount))}
      </span>
    </div>
  );
}
