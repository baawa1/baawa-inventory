'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { InlineLoading } from '@/components/ui/loading';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import {
  exportToCSV,
  generateExportFilename,
} from '@/lib/utils/finance';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { formatFinanceDateInput } from '@/lib/finance/date-range';

interface OverlapAuditResponse {
  dateRange: { startDate: string; endDate: string };
  summary: {
    totalFlaggedEntries: number;
    totalFlaggedAmount: number;
    categories: Record<string, { count: number; amount: number }>;
  };
  entries: Array<{
    id: number;
    transactionNumber: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    transactionDate: string;
    description: string | null;
    status: string;
    category: string;
    categoryLabel: string;
    createdBy: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

async function fetchOverlapAudit(dateRange?: DateRange): Promise<OverlapAuditResponse> {
  const params = new URLSearchParams();
  if (dateRange?.from) {
    params.set('startDate', formatFinanceDateInput(dateRange.from));
  }
  if (dateRange?.to) {
    params.set('endDate', formatFinanceDateInput(dateRange.to));
  }

  const response = await fetch(`/api/finance/overlap-audit?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch overlap audit');
  }

  const result = await response.json();
  return result.data;
}

export function OverlapAuditReport() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'finance-overlap-audit',
      dateRange?.from ? formatFinanceDateInput(dateRange.from) : undefined,
      dateRange?.to ? formatFinanceDateInput(dateRange.to) : undefined,
    ],
    queryFn: () => fetchOverlapAudit(dateRange),
    staleTime: 5 * 60 * 1000,
  });

  const exportRows = useMemo(
    () =>
      (data?.entries || []).map(entry => ({
        Transaction: entry.transactionNumber,
        Type: entry.type,
        Category: entry.categoryLabel,
        Amount: entry.amount,
        Status: entry.status,
        Date: entry.transactionDate,
        CreatedBy: `${entry.createdBy.firstName} ${entry.createdBy.lastName}`.trim(),
        Email: entry.createdBy.email,
        Description: entry.description || '',
      })),
    [data]
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <InlineLoading className="justify-center" label="Loading overlap audit..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load overlap audit.</p>
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
          title="Overlap Audit"
          description="Legacy manual finance entries excluded from reports because they duplicate operational sales or stock purchase data"
        />
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePickerWithPresets
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Select audit range"
          />
          <Button variant="outline" onClick={() => refetch()}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              exportToCSV(exportRows, generateExportFilename('finance-overlap-audit'))
            }
          >
            <IconDownload className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Flagged Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.totalFlaggedEntries || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Flagged Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(data?.summary.totalFlaggedAmount || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(data?.summary.categories || {}).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flagged Manual Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.entries || []).map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="font-medium">{entry.transactionNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.description || 'No description'}
                    </div>
                  </TableCell>
                  <TableCell>{entry.categoryLabel}</TableCell>
                  <TableCell>{entry.status}</TableCell>
                  <TableCell>
                    {`${entry.createdBy.firstName} ${entry.createdBy.lastName}`.trim()}
                  </TableCell>
                  <TableCell>
                    {new Date(entry.transactionDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(entry.amount)}
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
