'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { useFinancialTransaction } from '@/hooks/api/finance';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AppUser } from '@/types/user';
import {
  ArrowLeft,
  Edit,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

interface TransactionDetailProps {
  transactionId: number;
  user: AppUser;
}

export function TransactionDetail({
  transactionId,
  user: _user,
}: TransactionDetailProps) {
  const router = useRouter();
  const {
    data: transaction,
    isLoading,
    error,
  } = useFinancialTransaction(transactionId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground">
              Loading transaction details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="text-center">
          <DollarSign className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h2 className="mb-2 text-xl font-semibold">Transaction Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The transaction you're looking for doesn't exist or has been
            deleted.
          </p>
          <Button onClick={() => router.push('/finance')}>
            Back to Finance
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: 'secondary' as const, label: 'Pending' },
      COMPLETED: { variant: 'default' as const, label: 'Completed' },
      CANCELLED: { variant: 'destructive' as const, label: 'Cancelled' },
      APPROVED: { variant: 'default' as const, label: 'Approved' },
      REJECTED: { variant: 'destructive' as const, label: 'Rejected' },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isIncome = transaction.type === 'INCOME';

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/finance')}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Finance
        </Button>
        <div className="flex items-center justify-between">
          <PageHeader
            title={`${isIncome ? 'Income' : 'Expense'} Transaction`}
            description={`Transaction #${transaction.transactionNumber} - ${transaction.description}`}
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/finance/transactions/${transactionId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Transaction
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Transaction Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isIncome ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              Transaction Summary
            </CardTitle>
            {getStatusBadge(transaction.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4" />
                Amount
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(transaction.amount)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Transaction Date
              </div>
              <div className="text-lg font-medium">
                {formatDate(transaction.transactionDate)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              Description
            </div>
            <div className="text-lg">{transaction.description}</div>
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground text-sm">
              Transaction Number
            </div>
            <div className="font-mono text-lg">
              {transaction.transactionNumber}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-muted-foreground text-sm">Payment Method</div>
            <div className="font-medium">{transaction.paymentMethod}</div>
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground text-sm">
              Transaction Type
            </div>
            <div className="font-medium">{isIncome ? 'Income' : 'Expense'}</div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">
                Transaction ID
              </div>
              <div className="font-mono text-sm">{transaction.id}</div>
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">Created</div>
              <div className="text-sm">{formatDate(transaction.createdAt)}</div>
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">Last Updated</div>
              <div className="text-sm">{formatDate(transaction.updatedAt)}</div>
            </div>

            {transaction.createdByName && (
              <div className="space-y-2">
                <div className="text-muted-foreground text-sm">Created By</div>
                <div className="text-sm">{transaction.createdByName}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
