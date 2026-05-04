'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { InlineLoading } from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';
import {
  useApproveFinancialTransaction,
  useFinancialTransaction,
  useRejectFinancialTransaction,
} from '@/hooks/api/finance';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AppUser } from '@/types/user';
import {
  canUserEditFinancialTransaction,
  getFinanceUserDisplayName,
} from '@/lib/finance/transaction-access';
import {
  ArrowLeft,
  Edit,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface TransactionDetailProps {
  transactionId: number;
  user: AppUser;
}

export function TransactionDetail({
  transactionId,
  user,
}: TransactionDetailProps) {
  const router = useRouter();
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const {
    data: transaction,
    isLoading,
    error,
  } = useFinancialTransaction(transactionId);
  const approveTransaction = useApproveFinancialTransaction();
  const rejectTransaction = useRejectFinancialTransaction();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex h-64 items-center justify-center">
          <InlineLoading label="Loading transaction details..." />
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
            The transaction you&apos;re looking for doesn&apos;t exist or has
            been deleted.
          </p>
          <Button onClick={() => router.push('/finance/transactions')}>
            Back to Transactions
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
  const isAdmin = user.role === 'ADMIN';
  const isManager = user.role === 'MANAGER';
  const canEditTransaction = canUserEditFinancialTransaction(
    user.role,
    user.id,
    transaction
  );
  const canApproveTransaction = isAdmin && transaction.status === 'PENDING';
  const canRejectTransaction =
    (isAdmin || isManager) && transaction.status === 'PENDING';
  const createdByName =
    getFinanceUserDisplayName((transaction as any).createdByUser) ||
    (transaction as any).createdByName;
  const approvedByName =
    getFinanceUserDisplayName((transaction as any).approvedByUser) ||
    (transaction as any).approvedByName;

  const handleApprove = async () => {
    try {
      await approveTransaction.mutateAsync(transactionId);
      toast.success('Transaction approved successfully');
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to approve transaction'
      );
    }
  };

  const handleReject = async () => {
    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await rejectTransaction.mutateAsync({
        id: transactionId,
        reason: trimmedReason,
      });
      toast.success('Transaction rejected successfully');
      setRejectDialogOpen(false);
      setRejectReason('');
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : 'Failed to reject transaction'
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/finance/transactions')}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Transactions
        </Button>
        <div className="flex items-center justify-between">
          <PageHeader
            title={`${isIncome ? 'Income' : 'Expense'} Transaction`}
            description={`Transaction #${transaction.transactionNumber} - ${transaction.description}`}
          />
          <div className="flex items-center gap-2">
            {canRejectTransaction ? (
              <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Reject Transaction</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Transaction</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={rejectReason}
                      onChange={event => setRejectReason(event.target.value)}
                      placeholder="Explain why this transaction is being rejected"
                      rows={4}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setRejectDialogOpen(false)}
                        disabled={rejectTransaction.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={rejectTransaction.isPending}
                      >
                        {rejectTransaction.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          'Confirm Rejection'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : null}
            {canApproveTransaction ? (
              <Button
                onClick={handleApprove}
                disabled={approveTransaction.isPending}
              >
                {approveTransaction.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  'Approve Transaction'
                )}
              </Button>
            ) : null}
            {canEditTransaction ? (
              <Button variant="outline" asChild>
                <Link href={`/finance/transactions/${transactionId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Transaction
                </Link>
              </Button>
            ) : null}
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

            {createdByName && (
              <div className="space-y-2">
                <div className="text-muted-foreground text-sm">Created By</div>
                <div className="text-sm">{createdByName}</div>
              </div>
            )}

            {approvedByName ? (
              <div className="space-y-2">
                <div className="text-muted-foreground text-sm">Reviewed By</div>
                <div className="text-sm">{approvedByName}</div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
