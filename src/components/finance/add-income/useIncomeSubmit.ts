'use client';

import { UseFormReturn } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCreateFinancialTransaction } from '@/hooks/api/finance';
import type { CreateIncomeData } from './types';

export function useIncomeSubmit(
  form: UseFormReturn<CreateIncomeData>,
  setIsSubmitting: (_value: boolean) => void,
  setSubmitError: (_error: string | null) => void
) {
  const router = useRouter();
  const createTransaction = useCreateFinancialTransaction();

  const onSubmit = async (data: CreateIncomeData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Clean up data for submission
      const cleanedData = {
        ...data,
        amount: parseFloat(data.amount.toString()),
        description: data.description?.trim() || '',
        ...(data.type === 'INCOME' && {
          payerName: data.payerName?.trim() || undefined,
        }),
      };

      const _result = await createTransaction.mutateAsync(cleanedData);

      // Show success notification
      toast.success('Income transaction created successfully!');

      // Redirect to income list
      router.push('/finance/income');
    } catch (error) {
      console.error('Income form submission failed:', error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to create income transaction'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit };
}
