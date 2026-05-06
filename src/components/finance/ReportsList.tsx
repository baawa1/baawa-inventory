'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { AppUser } from '@/types/user';
import {
  useFinancialReportHistory,
  useFinancialReports,
  useGenerateFinancialReport,
} from '@/hooks/api/finance';
import { formatCurrency } from '@/lib/utils';
import {
  exportToCSV,
  generateExportFilename,
} from '@/lib/utils/finance';
import { formatFinanceDateInput } from '@/lib/finance/date-range';
import type { FinanceReportType } from '@/lib/finance/reporting';
import { toast } from 'sonner';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Download,
  FileText,
  RefreshCw,
  Wallet,
} from 'lucide-react';

interface ReportsListProps {
  user: AppUser;
}

type ReportPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

function formatRangeLabel(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return `${start.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })} - ${end.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

function formatReportTypeLabel(reportType: FinanceReportType) {
  switch (reportType) {
    case 'INCOME_STATEMENT':
      return 'Income Statement';
    case 'CASH_FLOW':
      return 'Cash Flow';
    case 'FINANCIAL_SUMMARY':
    default:
      return 'Financial Summary';
  }
}

export function ReportsList({ user: _user }: ReportsListProps) {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [reportType, setReportType] =
    useState<FinanceReportType>('FINANCIAL_SUMMARY');
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [startDate, setStartDate] = useState(() => {
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() - 1);
    return formatFinanceDateInput(currentDate);
  });
  const [endDate, setEndDate] = useState(() =>
    formatFinanceDateInput(new Date())
  );
  const [saveSnapshot, setSaveSnapshot] = useState(true);

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
  const { data: historyData, isLoading: historyLoading } =
    useFinancialReportHistory(12);
  const generateReport = useGenerateFinancialReport();

  const report = reportsData?.data;
  const history = historyData?.data || [];

  const quickLinks = useMemo(
    () => [
      {
        title: 'Income Statement',
        description:
          'Trading profit with recognised income, sold goods cost, and operating expenses.',
        href: '/finance/reports/income-statement',
      },
      {
        title: 'Cash Flow',
        description:
          'Cash received, cash spent, owner funding, and stock purchase cash out.',
        href: '/finance/reports/cash-flow',
      },
      {
        title: 'Analytics',
        description:
          'Trend analysis, receivables, revenue mix, and estimated health signals.',
        href: '/finance/reports/analytics',
      },
    ],
    []
  );

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error('Select both the start date and end date');
      return;
    }

    try {
      const response = await generateReport.mutateAsync({
        reportType,
        period,
        dateFrom: startDate,
        dateTo: endDate,
        saveSnapshot,
      });

      exportToCSV(
        response.data.report.exportRows,
        generateExportFilename(
          'financial-report',
          reportType.toLowerCase().replace(/_/g, '-')
        )
      );

      toast.success(
        response.data.snapshot
          ? `${formatReportTypeLabel(reportType)} exported and saved`
          : `${formatReportTypeLabel(reportType)} exported`
      );
      setIsGenerateDialogOpen(false);
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to export report'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <InlineLoading className="justify-center" label="Loading finance reports..." />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load financial reports.</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Financial Reports"
          description="Review trading performance, cash movement, and business position from the ledger-based finance model."
        />
        <div className="flex flex-wrap items-center gap-2">
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
                Export Or Save
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px]">
              <DialogHeader>
                <DialogTitle>Generate Report</DialogTitle>
                <DialogDescription>
                  Export a CSV and optionally save a snapshot to the report history.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select
                    value={reportType}
                    onValueChange={value => setReportType(value as FinanceReportType)}
                  >
                    <SelectTrigger id="reportType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FINANCIAL_SUMMARY">
                        Financial Summary
                      </SelectItem>
                      <SelectItem value="INCOME_STATEMENT">
                        Income Statement
                      </SelectItem>
                      <SelectItem value="CASH_FLOW">Cash Flow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="period">Period</Label>
                  <Select
                    value={period}
                    onValueChange={value => setPeriod(value as ReportPeriod)}
                  >
                    <SelectTrigger id="period">
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={event => setStartDate(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={event => setEndDate(event.target.value)}
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-lg border p-3">
                  <Checkbox
                    checked={saveSnapshot}
                    onCheckedChange={checked => setSaveSnapshot(Boolean(checked))}
                  />
                  <div className="space-y-1">
                    <span className="text-sm font-medium">
                      Save snapshot to history
                    </span>
                    <p className="text-muted-foreground text-xs">
                      Keep an auditable copy of this report with its date range and methodology status.
                    </p>
                  </div>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsGenerateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  isLoading={generateReport.isPending}
                  loadingText="Generating..."
                >
                  Generate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {report.methodology.estimated ? (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                <p className="font-medium text-amber-900">
                  Some report figures are estimated
                </p>
              </div>
              <div className="text-sm text-amber-800">
                {report.methodology.reasons.map(reason => (
                  <div key={reason}>{reason}</div>
                ))}
              </div>
            </div>
            <Badge variant="outline" className="border-amber-300 text-amber-900">
              Methodology: Estimated
            </Badge>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Trading Performance
            </CardTitle>
            <CardDescription>
              What the business actually earned from trading in the selected range.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <MetricRow
              label="Sales Revenue Recognised"
              value={report.incomeStatement.salesRevenueRecognised}
            />
            <MetricRow
              label="Other Operating Income"
              value={report.incomeStatement.otherOperatingIncome}
            />
            <MetricRow
              label="Cost Of Goods Sold"
              value={report.incomeStatement.costOfGoodsSold}
              negative
            />
            <MetricRow
              label="Operating Expenses"
              value={report.incomeStatement.operatingExpenses}
              negative
            />
            <MetricRow
              label="Net Profit"
              value={report.incomeStatement.netProfit}
              strong
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Cash Movement
            </CardTitle>
            <CardDescription>
              Real cash received and spent during the same range.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <MetricRow
              label="Cash Received"
              value={report.cashFlowStatement.cashReceived}
            />
            <MetricRow
              label="Cash Spent"
              value={report.cashFlowStatement.cashSpent}
              negative
            />
            <MetricRow
              label="Owner Funding"
              value={report.cashFlowStatement.ownerFunding}
            />
            <MetricRow
              label="Stock Purchase Cash Out"
              value={report.cashFlowStatement.stockPurchaseCashOut}
              negative
            />
            <MetricRow
              label="Net Cash Movement"
              value={report.cashFlowStatement.netCashMovement}
              strong
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Business Position
            </CardTitle>
            <CardDescription>
              Value still tied up in stock and money customers still owe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <MetricRow
              label="Inventory Value On Hand"
              value={report.businessPosition.inventoryValueOnHand}
            />
            <MetricRow
              label="Inventory Units On Hand"
              value={report.businessPosition.inventoryUnitsOnHand}
              plainNumber
            />
            <MetricRow
              label="Receivables Outstanding"
              value={report.businessPosition.receivablesOutstanding}
            />
            <MetricRow
              label="Customers With Balances"
              value={report.businessPosition.customersWithBalances}
              plainNumber
            />
            <MetricRow
              label="Total Ledger Rows"
              value={report.summary.totalTransactions}
              plainNumber
              strong
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {quickLinks.map(link => (
          <Card key={link.href}>
            <CardHeader>
              <CardTitle className="text-base">{link.title}</CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href={link.href}>
                  Open {link.title}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved Report History</CardTitle>
          <CardDescription>
            Range: {formatRangeLabel(report.dateRange.startDate, report.dateRange.endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <InlineLoading label="Loading saved report history..." />
          ) : history.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No saved report snapshots yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.reportName}
                    </TableCell>
                    <TableCell>
                      {formatRangeLabel(entry.periodStart, entry.periodEnd)}
                    </TableCell>
                    <TableCell>
                      {new Date(entry.generatedAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>{entry.generatedBy.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.methodologyStatus === 'exact'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {entry.methodologyStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricRow({
  label,
  value,
  negative = false,
  strong = false,
  plainNumber = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
  strong?: boolean;
  plainNumber?: boolean;
}) {
  const displayValue = plainNumber
    ? new Intl.NumberFormat('en-NG').format(value)
    : formatCurrency(value);

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={[
          'text-right',
          strong ? 'font-semibold' : 'font-medium',
          negative ? 'text-red-600' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {negative && !plainNumber ? '-' : ''}
        {plainNumber ? displayValue : displayValue.replace('-', '')}
      </span>
    </div>
  );
}
