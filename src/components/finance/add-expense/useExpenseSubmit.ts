"use client";

import { UseFormReturn } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateFinancialTransaction } from "@/hooks/api/finance";
import type { CreateExpenseData } from "./types";

export function useExpenseSubmit(
  form: UseFormReturn<CreateExpenseData>,
  setIsSubmitting: (_value: boolean) => void,
  setSubmitError: (_error: string | null) => void
) {
  const router = useRouter();
  const createTransaction = useCreateFinancialTransaction();

  const onSubmit = async (data: CreateExpenseData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Clean up data for submission
      const cleanedData = {
        ...data,
        amount: parseFloat(data.amount.toString()),
        description: data.description?.trim() || "",
        ...(data.type === "EXPENSE" && {
          vendorName: data.vendorName?.trim() || undefined,
        }),
      };

      const _result = await createTransaction.mutateAsync(cleanedData);

      // Show success notification
      toast.success("Expense transaction created successfully!");

      // Redirect to expense list
      router.push("/finance/expenses");
    } catch (error) {
      console.error("Expense form submission failed:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to create expense transaction"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit };
}
