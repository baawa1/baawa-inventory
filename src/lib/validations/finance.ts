import { z } from "zod";
import { FINANCIAL_TYPES, FINANCIAL_STATUS, CURRENCY } from "@/lib/constants";

// Financial Transaction Schema
export const financialTransactionSchema = z.object({
  type: z.enum([FINANCIAL_TYPES.EXPENSE, FINANCIAL_TYPES.INCOME]),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().default("NGN"),
  description: z.string().optional(),
  transactionDate: z.string().transform((val) => new Date(val)),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  status: z
    .enum(Object.values(FINANCIAL_STATUS) as [string, ...string[]])
    .default(FINANCIAL_STATUS.COMPLETED),
});

// Create Transaction Schema (combines transaction + details)
export const createTransactionSchema = z
  .object({
    // Basic transaction info
    type: z.enum([FINANCIAL_TYPES.EXPENSE, FINANCIAL_TYPES.INCOME]),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    currency: z.string().default("NGN"),
    description: z.string().optional(),
    transactionDate: z.string().transform((val) => new Date(val)),
    paymentMethod: z.string().optional(),
    referenceNumber: z.string().optional(),
    status: z
      .enum(Object.values(FINANCIAL_STATUS) as [string, ...string[]])
      .default(FINANCIAL_STATUS.COMPLETED),

    // Conditional details based on type
    expenseDetails: z
      .object({
        expenseType: z.string().min(1, "Expense type is required"),
        vendorName: z.string().optional(),
        vendorContact: z.string().optional(),
        taxAmount: z.number().min(0).default(0),
        taxRate: z.number().min(0).max(100).default(0),
        receiptUrl: z.string().url().optional().or(z.literal("")),
        notes: z.string().optional(),
      })
      .optional(),

    incomeDetails: z
      .object({
        incomeSource: z.string().min(1, "Income source is required"),
        payerName: z.string().optional(),
        payerContact: z.string().optional(),
        taxWithheld: z.number().min(0).default(0),
        taxRate: z.number().min(0).max(100).default(0),
        receiptUrl: z.string().url().optional().or(z.literal("")),
        notes: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // Ensure expense details are provided for expenses
      if (data.type === FINANCIAL_TYPES.EXPENSE) {
        return data.expenseDetails !== undefined;
      }
      // Ensure income details are provided for income
      if (data.type === FINANCIAL_TYPES.INCOME) {
        return data.incomeDetails !== undefined;
      }
      return true;
    },
    {
      message: "Details must be provided based on transaction type",
      path: ["details"],
    }
  );

// Update Transaction Schema
export const updateTransactionSchema = z
  .object({
    type: z
      .enum(Object.values(FINANCIAL_TYPES) as [string, ...string[]])
      .optional(),
    amount: z.number().min(0.01, "Amount must be greater than 0").optional(),
    currency: z.string().default(CURRENCY.CODE).optional(),
    description: z.string().optional(),
    transactionDate: z
      .string()
      .transform((val) => new Date(val))
      .optional(),
    status: z
      .enum(Object.values(FINANCIAL_STATUS) as [string, ...string[]])
      .optional(),
    referenceNumber: z.string().optional(),
    attachments: z.array(z.string()).optional(),

    expenseDetails: z
      .object({
        expenseType: z.string().min(1, "Expense type is required").optional(),
        vendorName: z.string().optional(),
        vendorContact: z.string().optional(),
        taxAmount: z.number().min(0).default(0).optional(),
        taxRate: z.number().min(0).max(100).default(0).optional(),
        receiptUrl: z.string().url().optional().or(z.literal("")).optional(),
        notes: z.string().optional(),
      })
      .optional(),

    incomeDetails: z
      .object({
        incomeSource: z.string().min(1, "Income source is required").optional(),
        payerName: z.string().optional(),
        payerContact: z.string().optional(),
        taxWithheld: z.number().min(0).default(0).optional(),
        taxRate: z.number().min(0).max(100).default(0).optional(),
        receiptUrl: z.string().url().optional().or(z.literal("")).optional(),
        notes: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // Ensure expense details are provided for expenses
      if (data.type === FINANCIAL_TYPES.EXPENSE) {
        return data.expenseDetails !== undefined;
      }
      // Ensure income details are provided for income
      if (data.type === FINANCIAL_TYPES.INCOME) {
        return data.incomeDetails !== undefined;
      }
      return true;
    },
    {
      message: "Details must be provided based on transaction type",
      path: ["details"],
    }
  );

// Expense Detail Schema
export const expenseDetailSchema = z.object({
  expenseType: z.string().min(1, "Expense type is required"),
  vendorName: z.string().optional(),
  vendorContact: z.string().optional(),
  taxAmount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  receiptUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

// Income Detail Schema
export const incomeDetailSchema = z.object({
  incomeSource: z.string().min(1, "Income source is required"),
  payerName: z.string().optional(),
  payerContact: z.string().optional(),
  taxWithheld: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  receiptUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

// Report Generation Schema
export const reportGenerationSchema = z
  .object({
    reportType: z.string().min(1, "Report type is required"),
    periodStart: z.string().transform((val) => new Date(val)),
    periodEnd: z.string().transform((val) => new Date(val)),
  })
  .refine((data) => data.periodEnd > data.periodStart, {
    message: "End date must be after start date",
    path: ["periodEnd"],
  });

// Transaction Filters Schema
export const transactionFiltersSchema = z.object({
  search: z.string().optional(),
  type: z
    .union([
      z.enum([FINANCIAL_TYPES.EXPENSE, FINANCIAL_TYPES.INCOME]),
      z.literal("ALL"),
    ])
    .optional(),
  status: z
    .union([
      z.enum(Object.values(FINANCIAL_STATUS) as [string, ...string[]]),
      z.literal("ALL"),
    ])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().default("transactionDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Type exports for use in components
export type FinancialTransactionInput = z.infer<
  typeof financialTransactionSchema
>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ExpenseDetailInput = z.infer<typeof expenseDetailSchema>;
export type IncomeDetailInput = z.infer<typeof incomeDetailSchema>;
export type ReportGenerationInput = z.infer<typeof reportGenerationSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
