'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils/finance';
import { AlertTriangle, DollarSign, Clock, Users } from 'lucide-react';

interface ReceivablesData {
  receivables: Array<{
    id: number;
    transactionNumber: string;
    customer: { name?: string; email?: string };
    saleDate: string;
    totalAmount: number;
    outstandingAmount: number;
    daysOutstanding: number;
    agingBucket: string;
    paymentStatus: string;
  }>;
  summary: {
    totalOutstanding: number;
    totalTransactions: number;
    averageDaysOutstanding: number;
    estimatedCollectable: number;
    collectionProbability: number;
  };
  aging: {
    '0-30': { count: number; amount: number };
    '31-60': { count: number; amount: number };
    '61-90': { count: number; amount: number };
    '90+': { count: number; amount: number };
  };
  topDebtors: Array<{
    customer: { name?: string };
    totalOwed: number;
    transactionCount: number;
  }>;
}

async function fetchReceivables(): Promise<ReceivablesData> {
  const response = await fetch('/api/finance/receivables');
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  return data.data;
}

const AGING_COLORS = {
  '0-30': '#22c55e',
  '31-60': '#f59e0b',
  '61-90': '#f97316',
  '90+': '#ef4444',
};

export function AccountsReceivableDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts-receivable'],
    queryFn: fetchReceivables,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <ReceivablesSkeleton />;
  if (error || !data) return <div>Failed to load receivables data</div>;

  const agingChartData = Object.entries(data.aging).map(([bucket, values]) => ({
    bucket,
    amount: values.amount,
    count: values.count,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Accounts Receivable</h2>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(data.summary.totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.summary.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Days Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.averageDaysOutstanding} days
            </div>
            <Badge
              variant={
                data.summary.averageDaysOutstanding <= 30
                  ? 'default'
                  : data.summary.averageDaysOutstanding <= 60
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {data.summary.averageDaysOutstanding <= 30
                ? 'Healthy'
                : data.summary.averageDaysOutstanding <= 60
                  ? 'Monitor'
                  : 'Action needed'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Est. Collectable</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.estimatedCollectable)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.summary.collectionProbability}% collection probability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">At Risk (90+ days)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.aging['90+'].amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.aging['90+'].count} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Aging Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Aging Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agingChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tickFormatter={v => `${v} days`} />
                <YAxis tickFormatter={v => formatCurrency(v)} />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v) || 0)}
                  labelFormatter={v => `${v} days`}
                />
                <Bar dataKey="amount" name="Amount Owed">
                  {agingChartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={AGING_COLORS[entry.bucket as keyof typeof AGING_COLORS]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Debtors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Outstanding Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount Owed</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topDebtors.map((debtor, i) => (
                  <TableRow key={i}>
                    <TableCell>{debtor.customer?.name || 'Walk-in'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(debtor.totalOwed)}
                    </TableCell>
                    <TableCell className="text-right">
                      {debtor.transactionCount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Receivables Table */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Sale Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.receivables.slice(0, 20).map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">
                    {r.transactionNumber}
                  </TableCell>
                  <TableCell>{r.customer?.name || 'Walk-in'}</TableCell>
                  <TableCell>
                    {new Date(r.saleDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(r.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-amber-600">
                    {formatCurrency(r.outstandingAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.daysOutstanding <= 30
                          ? 'default'
                          : r.daysOutstanding <= 60
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {r.daysOutstanding}d
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.paymentStatus}</Badge>
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

function ReceivablesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
