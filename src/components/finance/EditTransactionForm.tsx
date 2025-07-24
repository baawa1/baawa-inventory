"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  useFinancialTransaction,
  useUpdateTransaction,
} from "@/hooks/api/finance";
import { AppUser } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

interface EditTransactionFormProps {
  transactionId: number;
  user: AppUser;
}

type FormData = {
  id: number;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  transactionDate: string;
  paymentMethod: string;
  // Income specific fields
  incomeSource?: string;
  payerName?: string;
  // Expense specific fields
  expenseType?: string;
  vendorName?: string;
};

export function EditTransactionForm({
  transactionId,
  user: _user,
}: EditTransactionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    data: transaction,
    isLoading,
    error,
  } = useFinancialTransaction(transactionId);
  const updateTransaction = useUpdateTransaction();

  const form = useForm<FormData>({
    defaultValues: {
      id: transactionId,
      type: "INCOME",
      amount: 0,
      description: "",
      transactionDate: new Date().toISOString().split("T")[0],
      paymentMethod: "",
      incomeSource: "",
      payerName: "",
      expenseType: "",
      vendorName: "",
    },
  });

  // Populate form when transaction data is loaded
  React.useEffect(() => {
    if (transaction) {
      form.reset({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description || "",
        transactionDate: transaction.transactionDate
          .toISOString()
          .split("T")[0],
        paymentMethod: transaction.paymentMethod || "",
        // Income specific fields
        incomeSource: (transaction as any).incomeSource || "",
        payerName: (transaction as any).payerName || "",
        // Expense specific fields
        expenseType: (transaction as any).expenseType || "",
        vendorName: (transaction as any).vendorName || "",
      });
    }
  }, [transaction, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateTransaction.mutateAsync(data);
      toast.success("Transaction updated successfully");
      router.push(`/finance/transactions/${transactionId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update transaction";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              Loading transaction details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
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
            Update the details for this {transaction.type.toLowerCase()}{" "}
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
                          onChange={(e) =>
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
                        Transaction Date{" "}
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
              {transaction.type === "INCOME" ? (
                <FormField
                  control={form.control}
                  name="incomeSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Income Source{" "}
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
                          <SelectItem value="SALES">Sales Revenue</SelectItem>
                          <SelectItem value="LOAN">Loan</SelectItem>
                          <SelectItem value="SERVICES">Service Fees</SelectItem>
                          <SelectItem value="INVESTMENT">
                            Investment Income
                          </SelectItem>
                          <SelectItem value="RENTAL">Rental Income</SelectItem>
                          <SelectItem value="COMMISSION">Commission</SelectItem>
                          <SelectItem value="REFUND">Refund</SelectItem>
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
                          <SelectItem value="SUPPLIES">Supplies</SelectItem>
                          <SelectItem value="MARKETING">Marketing</SelectItem>
                          <SelectItem value="TRAVEL">Travel</SelectItem>
                          <SelectItem value="MAINTENANCE">
                            Maintenance
                          </SelectItem>
                          <SelectItem value="INSURANCE">Insurance</SelectItem>
                          <SelectItem value="TAXES">Taxes</SelectItem>
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
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="MOBILE_MONEY">
                          Mobile Money
                        </SelectItem>
                        <SelectItem value="CHECK">Check</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
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
                  transaction.type === "INCOME" ? "payerName" : "vendorName"
                }
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {transaction.type === "INCOME"
                        ? "Payer Name"
                        : "Vendor Name"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={`Enter ${transaction.type === "INCOME" ? "payer" : "vendor"} name (optional)`}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Transaction"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
