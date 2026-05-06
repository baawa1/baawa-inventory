import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth } from '#root/auth';
import { hasPermission } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';
import { formatCurrency } from '@/lib/utils';
import {
  ACTIVE_FINANCE_REPORT_TYPES,
  getFinanceReportMethodologyStatus,
  type FinanceReportPayload,
} from '@/lib/finance/reporting';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const metadata: Metadata = {
  title: 'Report Details | BaaWA Finance Manager',
  description: 'View detailed information about a financial report',
};

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getGeneratedByName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || user.email;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSavedFinanceReportPayload(
  value: unknown
): value is FinanceReportPayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecord(value.summary) &&
    isRecord(value.trading) &&
    isRecord(value.cashMovement) &&
    isRecord(value.businessPosition) &&
    Array.isArray(value.ledgerRows)
  );
}

function ReportMetric({
  label,
  value,
  plainNumber = false,
}: {
  label: string;
  value: number;
  plainNumber?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">
        {plainNumber
          ? new Intl.NumberFormat('en-NG').format(value)
          : formatCurrency(value)}
      </span>
    </div>
  );
}

export default async function ReportDetailPage({
  params,
}: ReportDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!hasPermission(session.user.role, 'FINANCIAL_REPORTS')) {
    redirect('/unauthorized');
  }

  const { id } = await params;
  const reportId = Number(id);

  if (!Number.isInteger(reportId) || reportId <= 0) {
    notFound();
  }

  const report = await prisma.financialReport.findFirst({
    where: {
      id: reportId,
      reportType: {
        in: [...ACTIVE_FINANCE_REPORT_TYPES],
      },
    },
    include: {
      generatedByUser: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!report) {
    notFound();
  }

  if (!isSavedFinanceReportPayload(report.reportData)) {
    notFound();
  }

  const reportData = report.reportData;
  const methodologyStatus = getFinanceReportMethodologyStatus(report.reportData);
  const recentRows = (reportData.ledgerRows || []).slice(0, 20);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/finance/reports">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back To Reports
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{report.reportName}</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {formatDate(report.periodStart)} - {formatDate(report.periodEnd)}
            </p>
          </div>
        </div>
        <Badge variant={methodologyStatus === 'exact' ? 'default' : 'secondary'}>
          Methodology: {methodologyStatus}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Snapshot Details</CardTitle>
          <CardDescription>
            Generated {formatDate(report.generatedAt)} by{' '}
            {getGeneratedByName(report.generatedByUser)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <ReportMetric
            label="Ledger Rows"
            value={reportData.summary.totalTransactions}
            plainNumber
          />
          <ReportMetric label="Gross Profit" value={reportData.summary.grossProfit} />
          <ReportMetric label="Net Profit" value={reportData.summary.netProfit} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Trading Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ReportMetric
              label="Sales Revenue"
              value={reportData.trading.salesRevenue}
            />
            <ReportMetric
              label="Operating Revenue"
              value={reportData.trading.operatingRevenue}
            />
            <ReportMetric
              label="Cost Of Goods Sold"
              value={reportData.trading.costOfGoodsSold}
            />
            <ReportMetric
              label="Operating Expenses"
              value={reportData.trading.operatingExpenses}
            />
            <ReportMetric label="Net Profit" value={reportData.trading.netProfit} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Movement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ReportMetric
              label="Cash Received"
              value={reportData.cashMovement.cashReceived}
            />
            <ReportMetric
              label="Cash Spent"
              value={reportData.cashMovement.cashSpent}
            />
            <ReportMetric
              label="Owner Funding"
              value={reportData.cashMovement.ownerFunding}
            />
            <ReportMetric
              label="Stock Purchases"
              value={reportData.cashMovement.stockPurchases}
            />
            <ReportMetric
              label="Net Cash Movement"
              value={reportData.cashMovement.netCashMovement}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ReportMetric
              label="Inventory Value"
              value={reportData.businessPosition.inventoryValueOnHand}
            />
            <ReportMetric
              label="Inventory Units"
              value={reportData.businessPosition.inventoryUnitsOnHand}
              plainNumber
            />
            <ReportMetric
              label="Receivables"
              value={reportData.businessPosition.receivablesOutstanding}
            />
            <ReportMetric
              label="Customers With Balances"
              value={reportData.businessPosition.customersWithBalances}
              plainNumber
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger Rows In Snapshot</CardTitle>
          <CardDescription>
            Showing {recentRows.length} of {reportData.ledgerRows.length} rows saved with this report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Cash</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRows.map(row => (
                <TableRow key={row.rowId}>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell>{row.displayLabel}</TableCell>
                  <TableCell>{row.transactionNumber}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.netCashImpact)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.netProfitImpact)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
