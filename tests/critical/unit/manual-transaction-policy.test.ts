import {
  MANUAL_ALLOWED_EXPENSE_TYPES,
  MANUAL_ALLOWED_INCOME_SOURCES,
  MANUAL_OVERLAP_EXPENSE_TYPES,
  MANUAL_OVERLAP_INCOME_SOURCES,
  getManualExpenseTypeError,
  getManualIncomeSourceError,
  isManualExpenseTypeBlocked,
  isManualIncomeSourceBlocked,
} from '@/lib/finance/manual-transaction-policy';

describe('manual transaction overlap policy', () => {
  it('blocks operational overlap categories from manual entry', () => {
    expect(MANUAL_OVERLAP_INCOME_SOURCES).toEqual(['SALES']);
    expect(MANUAL_OVERLAP_EXPENSE_TYPES).toEqual(['INVENTORY_PURCHASES']);

    expect(isManualIncomeSourceBlocked('SALES')).toBe(true);
    expect(isManualIncomeSourceBlocked('SERVICES')).toBe(false);
    expect(isManualExpenseTypeBlocked('INVENTORY_PURCHASES')).toBe(true);
    expect(isManualExpenseTypeBlocked('RENT')).toBe(false);
  });

  it('keeps blocked categories out of manual options', () => {
    expect(MANUAL_ALLOWED_INCOME_SOURCES).not.toContain('SALES');
    expect(MANUAL_ALLOWED_EXPENSE_TYPES).not.toContain(
      'INVENTORY_PURCHASES'
    );
  });

  it('returns specific overlap guidance messages', () => {
    expect(getManualIncomeSourceError('SALES')).toContain('POS sales');
    expect(getManualExpenseTypeError('INVENTORY_PURCHASES')).toContain(
      'stock additions'
    );
  });
});
