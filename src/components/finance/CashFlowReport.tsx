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
  IconAlertTriangle,
  IconArrowDownRight,
  IconArrowUpRight,
  IconDeviceFloppy,
  IconDownload,
  IconPrinter,
  IconRefresh,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { CashFlowForecastDashboard } from './dashboards/CashFlowForecastDashboard';

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
        reportType: 'CASH_FLOW',
        period,
        dateFrom: queryParams.dateFrom,
        dateTo: queryParams.dateTo,
        saveSnapshot: false,
      });

      exportToCSV(
        response.data.report.exportRows,
        generateExportFilename('cash-flow-report', period)
      );
      toast.success('Cash flow report exported');
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to export cash flow report'
      );
    }
  };

  const handleSaveSnapshot = async () => {
    try {
      const response = await generateReport.mutateAsync({
        reportType: 'CASH_FLOW',
        period,
        dateFrom: queryParams.dateFrom,
        dateTo: queryParams.dateTo,
        saveSnapshot: true,
      });

      toast.success(
        response.data.snapshot
          ? 'Cash flow snapshot saved'
          : 'Cash flow report generated'
      );
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to save cash flow snapshot'
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <InlineLoading className="justify-center" label="Loading cash flow..." />
      </div>
    );
  }

  if (error || !report) {
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

  const statement = report.cashFlowStatement;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Cash Flow"
          description="Cash movement view showing money received, money spent, stock purchases, and owner funding."
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
          title="Cash Received"
          amount={statement.cashReceived}
          positive
        />
        <SummaryCard
          title="Cash Spent"
          amount={statement.cashSpent}
          positive={false}
        />
        <SummaryCard
          title="Owner Funding"
          amount={statement.ownerFunding}
          positive
        />
        <SummaryCard
          title="Net Cash Movement"
          amount={statement.netCashMovement}
          positive={statement.netCashMovement >= 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Statement</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-3">
          <CashFlowSection
            title="Money In"
            rows={[
              ['Customer Collections', statement.customerCollections, false],
              ['Manual Income Collections', statement.manualIncomeCollections, false],
              ['Owner Funding', statement.ownerFunding, false],
              ['Total Cash Received', statement.cashReceived, false, true],
            ]}
          />
          <CashFlowSection
            title="Money Out"
            rows={[
              ['Operating Expense Payments', statement.operatingExpensePayments, true],
              ['Stock Purchase Cash Out', statement.stockPurchaseCashOut, true],
              ['Total Cash Spent', statement.cashSpent, true, true],
            ]}
          />
          <CashFlowSection
            title="Net Cash"
            rows={[
              ['Net Operating Cash Flow', statement.netOperatingCashFlow, false],
              ['Net Investing Cash Flow', statement.netInvestingCashFlow, false],
              ['Net Financing Cash Flow', statement.netFinancingCashFlow, false],
              ['Net Cash Movement', statement.netCashMovement, false, true],
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estimated Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <CashFlowForecastDashboard />
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  amount,
  positive,
}: {
  title: string;
  amount: number;
  positive: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`flex items-center gap-2 text-2xl font-bold ${
            positive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {positive ? (
            <IconArrowUpRight className="h-5 w-5" />
          ) : (
            <IconArrowDownRight className="h-5 w-5" />
          )}
          <span>{formatCurrency(amount)}</span>
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
  rows: Array<[string, number, boolean?, boolean?]>;
}) {
  return (
    <div className="space-y-4">
      <div className="font-semibold">{title}</div>
      <div className="space-y-2 text-sm">
        {rows.map(([label, amount, negative, strong]) => (
          <div
            key={label}
            className={`flex justify-between ${strong ? 'border-t pt-2 font-semibold' : ''}`}
          >
            <span>{label}</span>
            <span>
              {negative ? '-' : ''}
              {formatCurrency(Math.abs(amount))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
