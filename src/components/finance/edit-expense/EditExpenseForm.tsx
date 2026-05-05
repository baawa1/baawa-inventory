'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { PageHeader } from '@/components/ui/page-header';
import { InlineLoading } from '@/components/ui/loading';
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
import { formatFinanceDateInput } from '@/lib/finance/date-range';
import { FinancialTransactionDeleteAction } from '../shared/FinancialTransactionDeleteAction';

interface EditExpenseFormProps {
  user: AppUser;
  expenseId: string;
}

export default function EditExpenseForm({
  user,
  expenseId,
}: EditExpenseFormProps) {
  const router = useRouter();

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
        transactionDate: formatFinanceDateInput(
          new Date(expenseData.transactionDate)
        ),
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
              <FinancialTransactionDeleteAction
                transactionId={Number(expenseId)}
                transactionNumber={expenseData?.transactionNumber}
                transactionType="expense"
                transactionStatus={expenseData?.status ?? 'PENDING'}
                redirectTo="/finance/expenses"
                showBlockedHelperText
                renderTrigger={({ actionLabel, blocked, openDialog }) => (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={openDialog}
                    disabled={blocked}
                  >
                    <Trash2 className="h-4 w-4" />
                    {actionLabel}
                  </Button>
                )}
              />
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
    </div>
  );
}
