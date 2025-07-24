import { z } from "zod";

// Base transaction schema - simplified
export const baseTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  transactionDate: z.string().min(1, "Transaction date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

// Income transaction schema - simplified
export const incomeTransactionSchema = baseTransactionSchema.extend({
  type: z.literal("INCOME"),
  incomeSource: z.string().min(1, "Income source is required"),
  payerName: z.string().optional(),
});

// Expense transaction schema - simplified
export const expenseTransactionSchema = baseTransactionSchema.extend({
  type: z.literal("EXPENSE"),
  expenseType: z.string().min(1, "Expense type is required"),
  vendorName: z.string().optional(),
});

// Union schema for all transaction types
export const createTransactionSchema = z.discriminatedUnion("type", [
  incomeTransactionSchema,
  expenseTransactionSchema,
]);

// Update transaction schema (all fields optional)
export const updateTransactionSchema = z.object({
  id: z.number(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0").optional(),
  description: z.string().min(1, "Description is required").optional(),
  transactionDate: z.string().min(1, "Transaction date is required").optional(),
  paymentMethod: z.string().min(1, "Payment method is required").optional(),
  // Income specific fields
  incomeSource: z.string().min(1, "Income source is required").optional(),
  payerName: z.string().optional(),
  // Expense specific fields
  expenseType: z.string().min(1, "Expense type is required").optional(),
  vendorName: z.string().optional(),
});

// Query filters schema
export const transactionFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE", "ALL"]).optional(),
  status: z
    .enum(["PENDING", "COMPLETED", "CANCELLED", "APPROVED", "REJECTED", "ALL"])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Report filters schema
export const reportFiltersSchema = z.object({
  reportType: z.enum([
    "FINANCIAL_SUMMARY",
    "INCOME_STATEMENT",
    "EXPENSE_REPORT",
    "CASH_FLOW",
  ]),
  periodStart: z.string().min(1, "Start date is required"),
  periodEnd: z.string().min(1, "End date is required"),
  includeDetails: z.boolean().default(false),
});

export type CreateTransactionData = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionData = z.infer<typeof updateTransactionSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
export type ReportFilters = z.infer<typeof reportFiltersSchema>;
