import { z } from 'zod';
import { UseFormReturn } from 'react-hook-form';
import { expenseTransactionSchema } from '@/lib/validations/finance';
import {
  FINANCIAL_TYPES,
  PAYMENT_METHODS,
  MANUAL_ALLOWED_EXPENSE_TYPE_VALUES,
} from '@/lib/constants/finance';
import { formatFinanceDateInput } from '@/lib/finance/date-range';

// Form data type - only for expense transactions
export type CreateExpenseData = z.infer<typeof expenseTransactionSchema>;

// Default form values
export const defaultFormValues: CreateExpenseData = {
  type: FINANCIAL_TYPES.EXPENSE,
  amount: 0.01,
  description: '',
  transactionDate: formatFinanceDateInput(new Date()),
  paymentMethod: PAYMENT_METHODS.CASH,
  expenseType: MANUAL_ALLOWED_EXPENSE_TYPE_VALUES[0],
  vendorName: '',
};

// Form section props interface
export interface FormSectionProps {
  form: UseFormReturn<CreateExpenseData>;
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
