/**
 * @deprecated This file is deprecated. Import from '@/hooks/api/finance' instead.
 * This file re-exports from finance.ts for backward compatibility.
 */
export {
  useFinancialTransactions,
  useFinancialTransaction,
  useCreateFinancialTransaction as useCreateTransaction,
  useUpdateFinancialTransaction as useUpdateTransaction,
  useDeleteFinancialTransaction as useDeleteTransaction,
  type FinancialTransaction,
  type FinancialTransactionFilters,
  type FinancialTransactionPagination,
  type FinancialTransactionListResponse,
} from './finance';
