"use client";

import { UseFormReturn } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateTransaction } from "@/hooks/api/finance";
import type { CreateIncomeData } from "./types";
import { logger } from "@/lib/logger";

export function useIncomeSubmit(
  _form: UseFormReturn<CreateIncomeData>,
  setIsSubmitting: (_value: boolean) => void,
  setSubmitError: (_error: string | null) => void
) {
  const router = useRouter();
  const createTransaction = useCreateTransaction();

  const onSubmit = async (data: CreateIncomeData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Clean up data for submission
      const cleanedData = {
        ...data,
        amount: parseFloat(data.amount.toString()),
        description: data.description?.trim() || "",
        ...(data.type === "INCOME" && {
          payerName: data.payerName?.trim() || undefined,
        }),
      };

      await createTransaction.mutateAsync(cleanedData);

      // Show success notification
      toast.success("Income transaction created successfully!");

      // Redirect to income list
      router.push("/finance/income");
    } catch (error) {
      logger.error("Failed to create income transaction", {
        amount: data.amount,
        description: data.description,
        error: error instanceof Error ? error.message : String(error),
      });

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create income transaction";

      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit };
}
