'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  useFinancialTransaction,
  useUpdateFinancialTransaction,
} from '@/hooks/api/finance';
import { AppUser } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { InlineLoading } from '@/components/ui/loading';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import {
  MANUAL_ALLOWED_EXPENSE_TYPE_VALUES,
  MANUAL_ALLOWED_INCOME_SOURCE_VALUES,
} from '@/lib/constants/finance';
import {
  canUserEditFinancialTransaction,
  getFinanceUserDisplayName,
} from '@/lib/finance/transaction-access';
import { formatFinanceDateInput } from '@/lib/finance/date-range';

interface EditTransactionFormProps {
  transactionId: number;
  user: AppUser;
}

type FormData = {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  transactionDate: string;
  paymentMethod:
    | 'CASH'
    | 'BANK_TRANSFER'
    | 'POS_MACHINE'
    | 'CREDIT_CARD'
    | 'MOBILE_MONEY'
    ;
  // Income specific fields
  incomeSource?:
    | 'SERVICES'
    | 'INVESTMENTS'
    | 'ROYALTIES'
    | 'COMMISSIONS'
    | 'OTHER';
  payerName?: string;
  // Expense specific fields
  expenseType?:
    | 'UTILITIES'
    | 'RENT'
    | 'SALARIES'
    | 'MARKETING'
    | 'OFFICE_SUPPLIES'
    | 'TRAVEL'
    | 'MAINTENANCE'
    | 'INSURANCE'
    | 'OTHER';
  vendorName?: string;
};

export function EditTransactionForm({
  transactionId,
  user,
}: EditTransactionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    data: transaction,
    isLoading,
    error,
  } = useFinancialTransaction(transactionId);
  const updateTransaction = useUpdateFinancialTransaction();

  const form = useForm<FormData>({
    defaultValues: {
      id: transactionId,
      type: 'INCOME',
      amount: 0,
      description: '',
      transactionDate: formatFinanceDateInput(new Date()),
      paymentMethod: 'CASH',
      incomeSource: 'SERVICES',
      payerName: '',
      expenseType: 'UTILITIES',
      vendorName: '',
    },
  });

  // Populate form when transaction data is loaded
  React.useEffect(() => {
    if (transaction) {
      const paymentMethod = (transaction.paymentMethod ||
        'CASH') as FormData['paymentMethod'];
      const incomeSource = (
        transaction.incomeDetails?.incomeSource ||
        MANUAL_ALLOWED_INCOME_SOURCE_VALUES[0]
      ) as FormData['incomeSource'];
      const expenseType = (
        transaction.expenseDetails?.expenseType ||
        MANUAL_ALLOWED_EXPENSE_TYPE_VALUES[0]
      ) as FormData['expenseType'];

      form.reset({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description || '',
        transactionDate: formatFinanceDateInput(
          new Date(transaction.transactionDate)
        ),
        paymentMethod,
        incomeSource,
        payerName: transaction.incomeDetails?.payerName || '',
        expenseType,
        vendorName: transaction.expenseDetails?.vendorName || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateTransaction.mutateAsync({ id: transactionId, data });
      toast.success('Transaction updated successfully');
      router.push(`/finance/transactions/${transactionId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update transaction';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Transaction not found. Please check the transaction ID and try
            again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const canEditTransaction = canUserEditFinancialTransaction(user.role, user.id, {
    createdBy: transaction.createdBy,
    status: transaction.status,
  });

  if (!canEditTransaction) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You can only edit your own pending or completed transactions.
            {transaction.createdByUser && (
              <> This transaction was created by {getFinanceUserDisplayName(transaction.createdByUser) || 'another user'}.</>
            )}
          </AlertDescription>
        </Alert>
        <Button
          variant="ghost"
          onClick={() => router.push(`/finance/transactions/${transactionId}`)}
          className="mt-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Transaction
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/finance/transactions/${transactionId}`)}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Transaction
        </Button>
        <PageHeader
          title="Edit Transaction"
          description={`Update the details for transaction #${transactionId}`}
        />
      </div>

      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transaction Information</CardTitle>
          <CardDescription>
            Update the details for this {transaction.type.toLowerCase()}{' '}
            transaction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Amount (₦) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          onChange={e =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transactionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Transaction Date{' '}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="date" disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter a description for this transaction"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Transaction Type Specific Fields */}
              {transaction.type === 'INCOME' ? (
                <FormField
                  control={form.control}
                  name="incomeSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Income Source{' '}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select income source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SERVICES">Service Fees</SelectItem>
                          <SelectItem value="INVESTMENTS">
                            Investment Income
                          </SelectItem>
                          <SelectItem value="ROYALTIES">Royalties</SelectItem>
                          <SelectItem value="COMMISSIONS">Commission</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="expenseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Expense Type <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select expense type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="UTILITIES">Utilities</SelectItem>
                          <SelectItem value="RENT">Rent</SelectItem>
                          <SelectItem value="SALARIES">Salaries</SelectItem>
                          <SelectItem value="MARKETING">Marketing</SelectItem>
                          <SelectItem value="OFFICE_SUPPLIES">
                            Office Supplies
                          </SelectItem>
                          <SelectItem value="TRAVEL">Travel</SelectItem>
                          <SelectItem value="MAINTENANCE">
                            Maintenance
                          </SelectItem>
                          <SelectItem value="INSURANCE">Insurance</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Payment Method <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BANK_TRANSFER">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="POS_MACHINE">POS Machine</SelectItem>
                        <SelectItem value="CREDIT_CARD">
                          Credit Card
                        </SelectItem>
                        <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payer/Vendor Name */}
              <FormField
                control={form.control}
                name={
                  transaction.type === 'INCOME' ? 'payerName' : 'vendorName'
                }
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {transaction.type === 'INCOME'
                        ? 'Payer Name'
                        : 'Vendor Name'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={`Enter ${transaction.type === 'INCOME' ? 'payer' : 'vendor'} name (optional)`}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.push(`/finance/transactions/${transactionId}`)
                  }
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Updating..."
                >
                  Update Transaction
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
