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
import { incomeTransactionSchema } from '@/lib/validations/finance';

import { BasicInfoSection } from './add-income/BasicInfoSection';
import { IncomeDetailsSection } from './add-income/IncomeDetailsSection';
import { AdditionalInfoSection } from './add-income/AdditionalInfoSection';
import { FormActions } from './add-income/FormActions';
import { useFormDataQuery } from './add-income/useFormDataQuery';
import { useIncomeSubmit } from './add-income/useIncomeSubmit';
import { defaultFormValues } from './add-income/types';
import { AppUser } from '@/types/user';

interface AddIncomeFormProps {
  user: AppUser;
}

export default function AddIncomeForm({ user: _user }: AddIncomeFormProps) {
  const router = useRouter();
  const {
    isSubmitting,
    submitError,
    incomeSourceOptions,
    paymentMethodOptions,
    setIsSubmitting,
    setSubmitError,
  } = useFormDataQuery();

  const form = useForm({
    resolver: zodResolver(incomeTransactionSchema),
    defaultValues: defaultFormValues,
  });

  const { onSubmit } = useIncomeSubmit(form, setIsSubmitting, setSubmitError);

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
          title="Add Income Transaction"
          description="Record a new income transaction for your business"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income Information</CardTitle>
          <CardDescription>
            Enter the details for your new income transaction. Required fields
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

              <IncomeDetailsSection
                form={form}
                incomeSourceOptions={incomeSourceOptions}
                paymentMethodOptions={paymentMethodOptions}
              />

              <AdditionalInfoSection form={form} />

              <FormActions
                isSubmitting={isSubmitting}
                onCancelAction={() => router.push('/finance/income')}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
