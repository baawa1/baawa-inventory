import { z } from "zod";
import { expenseTransactionSchema } from "@/lib/validations/finance";
import {
  FINANCIAL_TYPES,
  PAYMENT_METHODS,
  EXPENSE_TYPES,
} from "@/lib/constants/finance";

// Form data type - only for expense transactions
export type CreateExpenseData = z.infer<typeof expenseTransactionSchema>;

// Default form values
export const defaultFormValues: CreateExpenseData = {
  type: FINANCIAL_TYPES.EXPENSE,
  amount: 0.01,
  description: "",
  transactionDate: new Date().toISOString().split("T")[0],
  paymentMethod: PAYMENT_METHODS.CASH,
  expenseType: EXPENSE_TYPES.OTHER,
  vendorName: "",
};

// Form section props interface
export interface FormSectionProps {
  form: any; // Will be properly typed when we create the form hook
}

// Expense type option interface
export interface ExpenseTypeOption {
  value: string;
  label: string;
}

// Payment method option interface
export interface PaymentMethodOption {
  value: string;
  label: string;
}
