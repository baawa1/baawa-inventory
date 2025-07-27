import { z } from 'zod';
import { incomeTransactionSchema } from '@/lib/validations/finance';
import {
  FINANCIAL_TYPES,
  PAYMENT_METHODS,
  INCOME_SOURCES,
} from '@/lib/constants/finance';

// Form data type - only for income transactions
export type CreateIncomeData = z.infer<typeof incomeTransactionSchema>;

// Default form values
export const defaultFormValues: CreateIncomeData = {
  type: FINANCIAL_TYPES.INCOME,
  amount: 0.01,
  description: '',
  transactionDate: new Date().toISOString().split('T')[0],
  paymentMethod: PAYMENT_METHODS.CASH,
  incomeSource: INCOME_SOURCES.SALES,
  payerName: '',
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
