/**
 * Shared finance types used across components
 */

export type FinancialType = 'INCOME' | 'EXPENSE';

export type FinancialStatus =
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'POS_MACHINE'
  | 'CREDIT_CARD'
  | 'MOBILE_MONEY'
  | null;

export interface ExpenseDetails {
  id: number;
  expenseType: string;
  vendorName: string | null;
}

export interface IncomeDetails {
  id: number;
  incomeSource: string;
  payerName: string | null;
}

export interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Financial transaction as returned by the API
 * Note: Date fields are strings (ISO format) from the API, not Date objects
 */
export interface FinancialTransaction {
  id: number;
  transactionNumber: string;
  type: FinancialType;
  amount: number;
  description: string | null;
  transactionDate: string; // ISO date string from API
  paymentMethod: PaymentMethod | string | null;
  status: FinancialStatus;
  rejectionReason?: string | null;
  approvedBy: number | null;
  approvedAt: string | null; // ISO date string from API
  createdBy: number;
  createdAt: string; // ISO date string from API
  updatedAt: string; // ISO date string from API
  expenseDetails?: ExpenseDetails | null;
  incomeDetails?: IncomeDetails | null;
  createdByUser: UserInfo;
  approvedByUser?: UserInfo | null;
}

/**
 * Pagination info returned by the API
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Standard API response for paginated transaction list
 */
export interface TransactionListResponse {
  success: boolean;
  data: FinancialTransaction[];
  pagination: PaginationInfo;
  message?: string;
}

/**
 * Filter parameters for transaction list queries
 */
export interface TransactionFilters {
  search?: string;
  type?: FinancialType | 'ALL';
  status?: FinancialStatus | 'ALL';
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'transactionDate' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
