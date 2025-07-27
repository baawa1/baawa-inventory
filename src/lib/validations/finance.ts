import { z } from 'zod';
import {
  FINANCIAL_TYPES,
  FINANCIAL_STATUS,
  PAYMENT_METHODS,
  EXPENSE_TYPES,
  INCOME_SOURCES,
} from '@/lib/constants/finance';

// Helper function to validate date range
const validateDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    throw new Error('Start date must be before end date');
  }
  return true;
};

// Base transaction schema - simplified
export const baseTransactionSchema = z.object({
  type: z.enum([FINANCIAL_TYPES.INCOME, FINANCIAL_TYPES.EXPENSE]),
  amount: z
    .number()
    .min(0.01, 'Amount must be greater than 0')
    .max(999999999.99, 'Amount is too large'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description is too long'),
  transactionDate: z
    .string()
    .min(1, 'Transaction date is required')
    .refine(date => {
      const inputDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return inputDate <= today;
    }, 'Transaction date cannot be in the future'),
  paymentMethod: z
    .enum(Object.values(PAYMENT_METHODS) as [string, ...string[]])
    .optional(),
});

// Income transaction schema - simplified
export const incomeTransactionSchema = baseTransactionSchema.extend({
  type: z.literal(FINANCIAL_TYPES.INCOME),
  incomeSource: z.enum(Object.values(INCOME_SOURCES) as [string, ...string[]]),
  payerName: z.string().max(255, 'Payer name is too long').optional(),
});

// Expense transaction schema - simplified
export const expenseTransactionSchema = baseTransactionSchema.extend({
  type: z.literal(FINANCIAL_TYPES.EXPENSE),
  expenseType: z.enum(Object.values(EXPENSE_TYPES) as [string, ...string[]]),
  vendorName: z.string().max(255, 'Vendor name is too long').optional(),
});

// Union schema for all transaction types
export const createTransactionSchema = z.discriminatedUnion('type', [
  incomeTransactionSchema,
  expenseTransactionSchema,
]);

// Update transaction schema (all fields optional)
export const updateTransactionSchema = z.object({
  id: z.number().positive('Invalid transaction ID'),
  type: z.enum([FINANCIAL_TYPES.INCOME, FINANCIAL_TYPES.EXPENSE]).optional(),
  amount: z
    .number()
    .min(0.01, 'Amount must be greater than 0')
    .max(999999999.99, 'Amount is too large')
    .optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description is too long')
    .optional(),
  transactionDate: z
    .string()
    .min(1, 'Transaction date is required')
    .refine(date => {
      const inputDate = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return inputDate <= today;
    }, 'Transaction date cannot be in the future')
    .optional(),
  paymentMethod: z
    .enum(Object.values(PAYMENT_METHODS) as [string, ...string[]])
    .optional(),
  // Income specific fields
  incomeSource: z
    .enum(Object.values(INCOME_SOURCES) as [string, ...string[]])
    .optional(),
  payerName: z.string().max(255, 'Payer name is too long').optional(),
  // Expense specific fields
  expenseType: z
    .enum(Object.values(EXPENSE_TYPES) as [string, ...string[]])
    .optional(),
  vendorName: z.string().max(255, 'Vendor name is too long').optional(),
});

// Query filters schema
export const transactionFiltersSchema = z
  .object({
    search: z.string().max(100, 'Search term is too long').optional(),
    type: z
      .enum([FINANCIAL_TYPES.INCOME, FINANCIAL_TYPES.EXPENSE, 'ALL'])
      .optional(),
    status: z
      .enum([...Object.values(FINANCIAL_STATUS), 'ALL'] as unknown as [
        string,
        ...string[],
      ])
      .optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.number().min(1, 'Page must be at least 1').default(1),
    limit: z
      .number()
      .min(1, 'Limit must be at least 1')
      .max(100, 'Limit cannot exceed 100')
      .default(10),
    sortBy: z
      .enum(['transactionDate', 'amount', 'createdAt', 'description'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine(
    data => {
      if (data.startDate && data.endDate) {
        return validateDateRange(data.startDate, data.endDate);
      }
      return true;
    },
    {
      message: 'Start date must be before end date',
      path: ['endDate'],
    }
  );

// Report filters schema
export const reportFiltersSchema = z
  .object({
    reportType: z.enum([
      'FINANCIAL_SUMMARY',
      'INCOME_STATEMENT',
      'EXPENSE_REPORT',
      'CASH_FLOW',
    ]),
    periodStart: z.string().min(1, 'Start date is required'),
    periodEnd: z.string().min(1, 'End date is required'),
    includeDetails: z.boolean().default(false),
  })
  .refine(data => validateDateRange(data.periodStart, data.periodEnd), {
    message: 'Start date must be before end date',
    path: ['periodEnd'],
  });

// Budget schema for future budget management
export const budgetSchema = z
  .object({
    category: z.enum(Object.values(EXPENSE_TYPES) as [string, ...string[]]),
    amount: z.number().min(0.01, 'Budget amount must be greater than 0'),
    period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    description: z.string().max(500, 'Description is too long').optional(),
  })
  .refine(data => validateDateRange(data.startDate, data.endDate), {
    message: 'Start date must be before end date',
    path: ['endDate'],
  });

export type CreateTransactionData = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionData = z.infer<typeof updateTransactionSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
export type ReportFilters = z.infer<typeof reportFiltersSchema>;
export type BudgetData = z.infer<typeof budgetSchema>;
