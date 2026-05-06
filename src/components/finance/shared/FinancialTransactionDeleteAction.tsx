'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDeleteFinancialTransaction } from '@/hooks/api/finance';

type TransactionVariant = 'income' | 'expense';

interface TriggerRenderProps {
  actionLabel: string;
  openDialog: () => void;
}

interface FinancialTransactionDeleteActionProps {
  transactionId: number;
  transactionNumber?: string;
  transactionType: TransactionVariant;
  renderTrigger: (_props: TriggerRenderProps) => React.ReactNode;
  redirectTo?: string;
}

export function FinancialTransactionDeleteAction({
  transactionId,
  transactionNumber,
  transactionType,
  renderTrigger,
  redirectTo,
}: FinancialTransactionDeleteActionProps) {
  const router = useRouter();
  const deleteTransactionMutation = useDeleteFinancialTransaction();
  const [open, setOpen] = React.useState(false);
  const [deleteReason, setDeleteReason] = React.useState('');

  const typeLabel = transactionType === 'income' ? 'income' : 'expense';
  const actionLabel =
    transactionType === 'income' ? 'Delete Income' : 'Delete Expense';

  const resetDialogState = React.useCallback(() => {
    setOpen(false);
    setDeleteReason('');
  }, []);

  const handleDelete = React.useCallback(async () => {
    const reason = deleteReason.trim();

    if (!reason) {
      toast.error(`Enter a reason for deleting this ${typeLabel} transaction`);
      return;
    }

    try {
      await deleteTransactionMutation.mutateAsync({
        id: transactionId,
        reason,
      });

      resetDialogState();
      toast.success(
        `${transactionType === 'income' ? 'Income' : 'Expense'} transaction deleted successfully`
      );

      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to delete ${typeLabel} transaction`
      );
    }
  }, [
    deleteReason,
    deleteTransactionMutation,
    redirectTo,
    resetDialogState,
    router,
    transactionId,
    transactionType,
    typeLabel,
  ]);

  const trigger = renderTrigger({
    actionLabel,
    openDialog: () => setOpen(true),
  });

  return (
    <>
      {trigger}
      <Dialog
        open={open}
        onOpenChange={nextOpen => {
          if (deleteTransactionMutation.isPending) {
            return;
          }

          setOpen(nextOpen);
          if (!nextOpen) {
            setDeleteReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionLabel}</DialogTitle>
            <DialogDescription>
              This permanently removes the {typeLabel} transaction from all{' '}
              {typeLabel} views, summaries, and reports.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {transactionNumber ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Deleting {typeLabel} #{transactionNumber} removes it from the
                normal {typeLabel} tables and financial totals. The audit log
                entry will remain.
              </div>
            ) : null}
            <div>
              <Label htmlFor={`delete-${transactionType}-reason`}>Reason</Label>
              <Textarea
                id={`delete-${transactionType}-reason`}
                rows={4}
                value={deleteReason}
                onChange={event => setDeleteReason(event.target.value)}
                placeholder={`Explain why this ${typeLabel} transaction is being deleted`}
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetDialogState}
              disabled={deleteTransactionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTransactionMutation.isPending}
            >
              {deleteTransactionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                actionLabel
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
