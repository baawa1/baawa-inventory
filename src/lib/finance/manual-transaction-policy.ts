import {
  EXPENSE_TYPES,
  INCOME_SOURCES,
  type ExpenseType,
  type IncomeSource,
} from '@/lib/constants/finance';

export const REPORTABLE_MANUAL_FINANCE_STATUSES = [
  'COMPLETED',
  'APPROVED',
] as const;

export const MANUAL_OVERLAP_INCOME_SOURCES = [
  INCOME_SOURCES.SALES,
] as const satisfies readonly IncomeSource[];

export const MANUAL_OVERLAP_EXPENSE_TYPES = [
  EXPENSE_TYPES.INVENTORY_PURCHASES,
] as const satisfies readonly ExpenseType[];

export const MANUAL_ALLOWED_INCOME_SOURCES = Object.values(INCOME_SOURCES).filter(
  source =>
    !(MANUAL_OVERLAP_INCOME_SOURCES as readonly string[]).includes(source)
) as IncomeSource[];

export const MANUAL_ALLOWED_EXPENSE_TYPES = Object.values(EXPENSE_TYPES).filter(
  expenseType =>
    !(MANUAL_OVERLAP_EXPENSE_TYPES as readonly string[]).includes(expenseType)
) as ExpenseType[];

export function isManualIncomeSourceBlocked(
  incomeSource?: string | null
): boolean {
  if (!incomeSource) {
    return false;
  }

  return (MANUAL_OVERLAP_INCOME_SOURCES as readonly string[]).includes(
    incomeSource
  );
}

export function isManualExpenseTypeBlocked(
  expenseType?: string | null
): boolean {
  if (!expenseType) {
    return false;
  }

  return (MANUAL_OVERLAP_EXPENSE_TYPES as readonly string[]).includes(
    expenseType
  );
}

export function getManualIncomeSourceError(source: string): string {
  if (source === INCOME_SOURCES.SALES) {
    return 'Sales revenue must come from POS sales and cannot be entered manually.';
  }

  return 'This income source is reserved for operational finance data.';
}

export function getManualExpenseTypeError(expenseType: string): string {
  if (expenseType === EXPENSE_TYPES.INVENTORY_PURCHASES) {
    return 'Inventory purchase expense must come from stock additions and cannot be entered manually.';
  }

  return 'This expense type is reserved for operational finance data.';
}
