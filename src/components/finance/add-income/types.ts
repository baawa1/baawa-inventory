import { z } from 'zod';
import { UseFormReturn } from 'react-hook-form';
import { incomeTransactionSchema } from '@/lib/validations/finance';
import {
  FINANCIAL_TYPES,
  PAYMENT_METHODS,
  MANUAL_ALLOWED_INCOME_SOURCE_VALUES,
} from '@/lib/constants/finance';
import { formatFinanceDateInput } from '@/lib/finance/date-range';

// Form data type - only for income transactions
export type CreateIncomeData = z.infer<typeof incomeTransactionSchema>;

// Default form values
export const defaultFormValues: CreateIncomeData = {
  type: FINANCIAL_TYPES.INCOME,
  amount: 0.01,
  description: '',
  transactionDate: formatFinanceDateInput(new Date()),
  paymentMethod: PAYMENT_METHODS.CASH,
  incomeSource: MANUAL_ALLOWED_INCOME_SOURCE_VALUES[0],
  payerName: '',
};

// Form section props interface
export interface FormSectionProps {
  form: UseFormReturn<CreateIncomeData>;
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
