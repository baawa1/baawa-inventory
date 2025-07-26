"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { expenseTransactionSchema } from "@/lib/validations/finance";

import { BasicInfoSection } from "../add-expense/BasicInfoSection";
import { ExpenseDetailsSection } from "../add-expense/ExpenseDetailsSection";
import { AdditionalInfoSection } from "../add-expense/AdditionalInfoSection";
import { FormActions } from "../add-expense/FormActions";
import { useFormDataQuery } from "../add-expense/useFormDataQuery";
import { useExpenseSubmit } from "../add-expense/useExpenseSubmit";
import { defaultFormValues } from "../add-expense/types";
import { AppUser } from "@/types/user";
import { useExpenseData } from "./useExpenseData";
import { useExpenseUpdate } from "./useExpenseUpdate";

interface EditExpenseFormProps {
  user: AppUser;
  expenseId: string;
}

export default function EditExpenseForm({
  user: _user,
  expenseId,
}: EditExpenseFormProps) {
  const router = useRouter();

  const {
    isSubmitting,
    submitError,
    expenseTypeOptions,
    paymentMethodOptions,
    setIsSubmitting,
    setSubmitError,
  } = useFormDataQuery();

  // Load existing expense data
  const {
    data: expenseData,
    isLoading: isLoadingExpense,
    error: loadError,
  } = useExpenseData(expenseId);

  // Update mutation
  const { updateExpense: _updateExpense } = useExpenseUpdate();

  const form = useForm({
    resolver: zodResolver(expenseTransactionSchema),
    defaultValues: defaultFormValues,
  });

  // Update form when data loads
  React.useEffect(() => {
    if (expenseData && expenseData.type === "EXPENSE") {
      form.reset({
        type: "EXPENSE",
        amount: expenseData.amount,
        description: expenseData.description || "",
        transactionDate: new Date(expenseData.transactionDate)
          .toISOString()
          .split("T")[0],
        paymentMethod: expenseData.paymentMethod || "",
        expenseType: expenseData.expenseDetails?.expenseType || "",
        vendorName: expenseData.expenseDetails?.vendorName || "",
      });
    }
  }, [expenseData, form]);

  const { onSubmit } = useExpenseSubmit(form, setIsSubmitting, setSubmitError);

  if (isLoadingExpense) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading expense data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load expense data: {loadError.message}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/finance/expenses")}>
          Back to Expenses
        </Button>
      </div>
    );
  }

  // Check if the transaction is actually an expense transaction
  if (expenseData && expenseData.type !== "EXPENSE") {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Alert variant="destructive">
          <AlertDescription>
            This transaction is not an expense transaction. Cannot edit as
            expense.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/finance/expenses")}>
          Back to Expenses
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/finance/expenses")}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Expenses
        </Button>
        <PageHeader
          title="Edit Expense Transaction"
          description="Update the details for this expense transaction"
        />
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
                isSubmitting={isSubmitting}
                onCancelAction={() => router.push("/finance/expenses")}
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
