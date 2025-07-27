'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
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
import { expenseTransactionSchema } from '@/lib/validations/finance';

import { BasicInfoSection } from './add-expense/BasicInfoSection';
import { ExpenseDetailsSection } from './add-expense/ExpenseDetailsSection';
import { AdditionalInfoSection } from './add-expense/AdditionalInfoSection';
import { FormActions } from './add-expense/FormActions';
import { useFormDataQuery } from './add-expense/useFormDataQuery';
import { useExpenseSubmit } from './add-expense/useExpenseSubmit';
import { defaultFormValues } from './add-expense/types';
import { AppUser } from '@/types/user';

interface AddExpenseFormProps {
  user: AppUser;
}

export default function AddExpenseForm({ user: _user }: AddExpenseFormProps) {
  const router = useRouter();
  const {
    isSubmitting,
    submitError,
    expenseTypeOptions,
    paymentMethodOptions,
    setIsSubmitting,
    setSubmitError,
  } = useFormDataQuery();

  const form = useForm({
    resolver: zodResolver(expenseTransactionSchema),
    defaultValues: defaultFormValues,
  });

  const { onSubmit } = useExpenseSubmit(form, setIsSubmitting, setSubmitError);

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
        <PageHeader
          title="Add Expense Transaction"
          description="Record a new expense transaction for your business"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Information</CardTitle>
          <CardDescription>
            Enter the details for your new expense transaction. Required fields
            are marked with an asterisk (*).
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
                isSubmitting={isSubmitting}
                onCancelAction={() => router.push('/finance/expenses')}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
