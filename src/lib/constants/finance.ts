// Finance Constants - must match Prisma schema exactly

// Financial Types (must match Prisma FinancialType enum exactly)
export const FINANCIAL_TYPES = {
  EXPENSE: 'EXPENSE',
  INCOME: 'INCOME',
} as const;

export type FinancialType =
  (typeof FINANCIAL_TYPES)[keyof typeof FINANCIAL_TYPES];

// Financial Status (must match Prisma FinancialStatus enum exactly)
export const FINANCIAL_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type FinancialStatus =
  (typeof FINANCIAL_STATUS)[keyof typeof FINANCIAL_STATUS];

// Expense types (must match Prisma ExpenseType enum exactly)
export const EXPENSE_TYPES = {
  INVENTORY_PURCHASES: 'INVENTORY_PURCHASES',
  UTILITIES: 'UTILITIES',
  RENT: 'RENT',
  SALARIES: 'SALARIES',
  MARKETING: 'MARKETING',
  OFFICE_SUPPLIES: 'OFFICE_SUPPLIES',
  TRAVEL: 'TRAVEL',
  INSURANCE: 'INSURANCE',
  MAINTENANCE: 'MAINTENANCE',
  OTHER: 'OTHER',
} as const;

export type ExpenseType = (typeof EXPENSE_TYPES)[keyof typeof EXPENSE_TYPES];

// Income sources (must match Prisma IncomeSource enum exactly)
export const INCOME_SOURCES = {
  SALES: 'SALES',
  SERVICES: 'SERVICES',
  INVESTMENTS: 'INVESTMENTS',
  ROYALTIES: 'ROYALTIES',
  COMMISSIONS: 'COMMISSIONS',
  OTHER: 'OTHER',
} as const;

export type IncomeSource = (typeof INCOME_SOURCES)[keyof typeof INCOME_SOURCES];

// Payment methods (must match Prisma PaymentMethod enum exactly)
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  POS_MACHINE: 'POS_MACHINE',
  CREDIT_CARD: 'CREDIT_CARD',
  MOBILE_MONEY: 'MOBILE_MONEY',
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

// UI-friendly labels
export const FINANCIAL_TYPE_LABELS = {
  [FINANCIAL_TYPES.EXPENSE]: 'Expense',
  [FINANCIAL_TYPES.INCOME]: 'Income',
} as const;

export const FINANCIAL_STATUS_LABELS = {
  [FINANCIAL_STATUS.PENDING]: 'Pending',
  [FINANCIAL_STATUS.COMPLETED]: 'Completed',
  [FINANCIAL_STATUS.CANCELLED]: 'Cancelled',
  [FINANCIAL_STATUS.APPROVED]: 'Approved',
  [FINANCIAL_STATUS.REJECTED]: 'Rejected',
} as const;

export const EXPENSE_TYPE_LABELS = {
  INVENTORY_PURCHASES: 'Inventory Purchases',
  UTILITIES: 'Utilities',
  RENT: 'Rent',
  SALARIES: 'Salaries',
  MARKETING: 'Marketing',
  OFFICE_SUPPLIES: 'Office Supplies',
  TRAVEL: 'Travel',
  INSURANCE: 'Insurance',
  MAINTENANCE: 'Maintenance',
  OTHER: 'Other',
} as const;

export const INCOME_SOURCE_LABELS = {
  SALES: 'Sales',
  SERVICES: 'Services',
  INVESTMENTS: 'Investments',
  ROYALTIES: 'Royalties',
  COMMISSIONS: 'Commissions',
  OTHER: 'Other',
} as const;

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Cash',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Bank Transfer',
  [PAYMENT_METHODS.POS_MACHINE]: 'POS Machine',
  [PAYMENT_METHODS.CREDIT_CARD]: 'Credit Card',
  [PAYMENT_METHODS.MOBILE_MONEY]: 'Mobile Money',
} as const;
