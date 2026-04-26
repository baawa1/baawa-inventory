'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { PageHeader } from '@/components/ui/page-header';
import { Label } from '@/components/ui/label';
import { InlineLoading } from '@/components/ui/loading';
import { Textarea } from '@/components/ui/textarea';
import { useDeleteFinancialTransaction } from '@/hooks/api/finance';
import { canDeleteFinance } from '@/lib/auth/roles';
import { expenseTransactionSchema, ExpenseTransactionFormData } from '@/lib/validations/finance';

import { BasicInfoSection } from '../add-expense/BasicInfoSection';
import { ExpenseDetailsSection } from '../add-expense/ExpenseDetailsSection';
import { AdditionalInfoSection } from '../add-expense/AdditionalInfoSection';
import { FormActions } from '../add-expense/FormActions';
import { useFormDataQuery } from '../add-expense/useFormDataQuery';
import { defaultFormValues } from '../add-expense/types';
import { AppUser } from '@/types/user';
import { useExpenseData } from './useExpenseData';
import { useExpenseUpdate } from './useExpenseUpdate';

interface EditExpenseFormProps {
  user: AppUser;
  expenseId: string;
}

export default function EditExpenseForm({
  user,
  expenseId,
}: EditExpenseFormProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteReason, setDeleteReason] = React.useState('');

  const {
    submitError,
    expenseTypeOptions,
    paymentMethodOptions,
    setSubmitError,
  } = useFormDataQuery();

  // Load existing expense data
  const {
    data: expenseData,
    isLoading: isLoadingExpense,
    error: loadError,
  } = useExpenseData(expenseId);

  // Update mutation
  const { updateExpense, isUpdating } = useExpenseUpdate();
  const deleteTransactionMutation = useDeleteFinancialTransaction();

  const form = useForm({
    resolver: zodResolver(expenseTransactionSchema),
    defaultValues: defaultFormValues,
  });

  // Update form when data loads
  React.useEffect(() => {
    if (expenseData && expenseData.type === 'EXPENSE') {
      form.reset({
        type: 'EXPENSE',
        amount: expenseData.amount,
        description: expenseData.description || '',
        transactionDate: new Date(expenseData.transactionDate)
          .toISOString()
          .split('T')[0],
        paymentMethod: expenseData.paymentMethod || '',
        expenseType: expenseData.expenseDetails?.expenseType || '',
        vendorName: expenseData.expenseDetails?.vendorName || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseData]);

  const onSubmit = async (data: ExpenseTransactionFormData) => {
    setSubmitError(null);
    try {
      await updateExpense({
        id: expenseId,
        data: {
          amount: data.amount,
          description: data.description,
          transactionDate: data.transactionDate,
          paymentMethod: data.paymentMethod || 'CASH',
          expenseType: data.expenseType,
          vendorName: data.vendorName,
        },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update expense');
    }
  };

  const canDeleteTransaction = canDeleteFinance(user.role);
  const deleteBlocked =
    expenseData !== undefined &&
    ['APPROVED', 'REJECTED'].includes(expenseData.status);

  const handleDeleteExpense = async () => {
    const reason = deleteReason.trim();

    if (!reason) {
      toast.error('Enter a reason for deleting this expense transaction');
      return;
    }

    try {
      await deleteTransactionMutation.mutateAsync({
        id: Number(expenseId),
        reason,
      });
      setDeleteDialogOpen(false);
      setDeleteReason('');
      toast.success('Expense transaction deleted successfully');
      router.push('/finance/expenses');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete expense transaction'
      );
    }
  };

  if (isLoadingExpense) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="flex h-64 items-center justify-center">
          <InlineLoading label="Loading expense data..." />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load expense data: {loadError.message}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/finance/expenses')}>
          Back to Expenses
        </Button>
      </div>
    );
  }

  // Check if the transaction is actually an expense transaction
  if (expenseData && expenseData.type !== 'EXPENSE') {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Alert variant="destructive">
          <AlertDescription>
            This transaction is not an expense transaction. Cannot edit as
            expense.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/finance/expenses')}>
          Back to Expenses
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/finance/expenses')}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Expenses
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Edit Expense Transaction"
            description="Update the details for this expense transaction"
          />
          {canDeleteTransaction && (
            <div className="flex flex-col gap-2 sm:items-end">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleteBlocked}
              >
                <Trash2 className="h-4 w-4" />
                Delete Expense
              </Button>
              {deleteBlocked && (
                <p className="text-muted-foreground text-sm sm:text-right">
                  Approved or rejected expense transactions cannot be deleted.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Information</CardTitle>
          <CardDescription>
            Update the details for your expense transaction. Required fields are
            marked with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <BasicInfoSection form={form} />

              <ExpenseDetailsSection
                form={form}
                expenseTypeOptions={expenseTypeOptions}
                paymentMethodOptions={paymentMethodOptions}
              />

              <AdditionalInfoSection form={form} />

              <FormActions
                isSubmitting={isUpdating}
                onCancelAction={() => router.push('/finance/expenses')}
                submitText="Update Expense Transaction"
                loadingText="Updating..."
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={open => {
          if (deleteTransactionMutation.isPending) {
            return;
          }

          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              This permanently removes the expense transaction from all expense
              views, summaries, and reports.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {expenseData && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Deleting expense #{expenseData.transactionNumber} removes it
                from the normal expense tables and financial totals. The audit
                log entry will remain.
              </div>
            )}
            <div>
              <Label htmlFor="delete-expense-reason">Reason</Label>
              <Textarea
                id="delete-expense-reason"
                rows={4}
                value={deleteReason}
                onChange={event => setDeleteReason(event.target.value)}
                placeholder="Explain why this expense transaction is being deleted"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteReason('');
              }}
              disabled={deleteTransactionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteExpense}
              isLoading={deleteTransactionMutation.isPending}
              loadingText="Deleting..."
            >
              Delete Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
