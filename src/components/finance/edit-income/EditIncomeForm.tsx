'use client';

import React from 'react';
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
import { incomeTransactionSchema } from '@/lib/validations/finance';
import { BasicInfoSection } from '../add-income/BasicInfoSection';
import { IncomeDetailsSection } from '../add-income/IncomeDetailsSection';
import { AdditionalInfoSection } from '../add-income/AdditionalInfoSection';
import { FormActions } from '../add-income/FormActions';
import { useFormDataQuery } from '../add-income/useFormDataQuery';
import { useIncomeSubmit } from '../add-income/useIncomeSubmit';
import { defaultFormValues } from '../add-income/types';
import { AppUser } from '@/types/user';
import { useIncomeData } from './useIncomeData';
import { useIncomeUpdate } from './useIncomeUpdate';

interface EditIncomeFormProps {
  user: AppUser;
  incomeId: string;
}

export default function EditIncomeForm({
  user: _user,
  incomeId,
}: EditIncomeFormProps) {
  const router = useRouter();

  const {
    isSubmitting,
    submitError,
    incomeSourceOptions,
    paymentMethodOptions,
    setIsSubmitting,
    setSubmitError,
  } = useFormDataQuery();

  // Load existing income data
  const {
    data: incomeData,
    isLoading: isLoadingIncome,
    error: loadError,
  } = useIncomeData(incomeId);

  // Update mutation
  const { updateIncome: _updateIncome } = useIncomeUpdate();

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
  }, [incomeData, form]);

  const { onSubmit } = useIncomeSubmit(form, setIsSubmitting, setSubmitError);

  if (isLoadingIncome) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading income data...</p>
          </div>
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
        <PageHeader
          title="Edit Income Transaction"
          description="Update the details for this income transaction"
        />
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
                isSubmitting={isSubmitting}
                onCancelAction={() => router.push('/finance/income')}
                submitText="Update Income Transaction"
                loadingText="Updating..."
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
