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
import { incomeTransactionSchema, IncomeTransactionFormData } from '@/lib/validations/finance';
import { BasicInfoSection } from '../add-income/BasicInfoSection';
import { IncomeDetailsSection } from '../add-income/IncomeDetailsSection';
import { AdditionalInfoSection } from '../add-income/AdditionalInfoSection';
import { FormActions } from '../add-income/FormActions';
import { useFormDataQuery } from '../add-income/useFormDataQuery';
import { defaultFormValues } from '../add-income/types';
import { AppUser } from '@/types/user';
import { useIncomeData } from './useIncomeData';
import { useIncomeUpdate } from './useIncomeUpdate';

interface EditIncomeFormProps {
  user: AppUser;
  incomeId: string;
}

export default function EditIncomeForm({
  user,
  incomeId,
}: EditIncomeFormProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteReason, setDeleteReason] = React.useState('');

  const {
    submitError,
    incomeSourceOptions,
    paymentMethodOptions,
    setSubmitError,
  } = useFormDataQuery();

  // Load existing income data
  const {
    data: incomeData,
    isLoading: isLoadingIncome,
    error: loadError,
  } = useIncomeData(incomeId);

  // Update mutation
  const { updateIncome, isUpdating } = useIncomeUpdate();
  const deleteTransactionMutation = useDeleteFinancialTransaction();

  const form = useForm({
    resolver: zodResolver(incomeTransactionSchema),
    defaultValues: defaultFormValues,
  });

  // Update form when data loads
  React.useEffect(() => {
    if (incomeData && incomeData.type === 'INCOME') {
      form.reset({
        type: 'INCOME',
        amount: incomeData.amount,
        description: incomeData.description || '',
        transactionDate: new Date(incomeData.transactionDate)
          .toISOString()
          .split('T')[0],
        paymentMethod: incomeData.paymentMethod || '',
        incomeSource: incomeData.incomeDetails?.incomeSource || '',
        payerName: incomeData.incomeDetails?.payerName || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomeData]);

  const onSubmit = async (data: IncomeTransactionFormData) => {
    setSubmitError(null);
    try {
      await updateIncome({
        id: incomeId,
        data: {
          amount: data.amount,
          description: data.description,
          transactionDate: data.transactionDate,
          paymentMethod: data.paymentMethod || 'CASH',
          incomeSource: data.incomeSource,
          payerName: data.payerName,
        },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update income');
    }
  };

  const canDeleteTransaction = canDeleteFinance(user.role);
  const deleteBlocked =
    incomeData !== undefined &&
    ['APPROVED', 'REJECTED'].includes(incomeData.status);

  const handleDeleteIncome = async () => {
    const reason = deleteReason.trim();

    if (!reason) {
      toast.error('Enter a reason for deleting this income transaction');
      return;
    }

    try {
      await deleteTransactionMutation.mutateAsync({
        id: Number(incomeId),
        reason,
      });
      setDeleteDialogOpen(false);
      setDeleteReason('');
      toast.success('Income transaction deleted successfully');
      router.push('/finance/income');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete income transaction'
      );
    }
  };

  if (isLoadingIncome) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="flex h-64 items-center justify-center">
          <InlineLoading label="Loading income data..." />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load income data: {loadError.message}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/finance/income')}>
          Back to Income
        </Button>
      </div>
    );
  }

  // Check if the transaction is actually an income transaction
  if (incomeData && incomeData.type !== 'INCOME') {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Alert variant="destructive">
          <AlertDescription>
            This transaction is not an income transaction. Cannot edit as
            income.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/finance/income')}>
          Back to Income
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/finance/income')}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Income
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Edit Income Transaction"
            description="Update the details for this income transaction"
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
                Delete Income
              </Button>
              {deleteBlocked && (
                <p className="text-muted-foreground text-sm sm:text-right">
                  Approved or rejected income transactions cannot be deleted.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income Information</CardTitle>
          <CardDescription>
            Update the details for your income transaction. Required fields are
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

              <IncomeDetailsSection
                form={form}
                incomeSourceOptions={incomeSourceOptions}
                paymentMethodOptions={paymentMethodOptions}
              />

              <AdditionalInfoSection form={form} />

              <FormActions
                isSubmitting={isUpdating}
                onCancelAction={() => router.push('/finance/income')}
                submitText="Update Income Transaction"
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
            <DialogTitle>Delete Income</DialogTitle>
            <DialogDescription>
              This permanently removes the income transaction from all income
              views, summaries, and reports.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {incomeData && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Deleting income #{incomeData.transactionNumber} removes it from
                the normal income tables and financial totals. The audit log
                entry will remain.
              </div>
            )}
            <div>
              <Label htmlFor="delete-income-reason">Reason</Label>
              <Textarea
                id="delete-income-reason"
                rows={4}
                value={deleteReason}
                onChange={event => setDeleteReason(event.target.value)}
                placeholder="Explain why this income transaction is being deleted"
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
              onClick={handleDeleteIncome}
              isLoading={deleteTransactionMutation.isPending}
              loadingText="Deleting..."
            >
              Delete Income
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
