import { z } from "zod";
import { incomeTransactionSchema } from "@/lib/validations/finance";

// Form data type - only for income transactions
export type CreateIncomeData = z.infer<typeof incomeTransactionSchema>;

// Default form values
export const defaultFormValues: CreateIncomeData = {
  type: "INCOME",
  amount: 0.01,
  description: "",
  transactionDate: new Date().toISOString().split("T")[0],
  paymentMethod: "CASH",
  incomeSource: "SALES",
  payerName: "",
};

// Form section props interface
export interface FormSectionProps {
  form: any; // Will be properly typed when we create the form hook
}

// Income source option interface
export interface IncomeSourceOption {
  value: string;
  label: string;
}

// Payment method option interface
export interface PaymentMethodOption {
  value: string;
  label: string;
}
