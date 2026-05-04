import {
  canUserEditFinancialTransaction,
  getFinanceUserDisplayName,
  isFinancialTransactionMutable,
} from '@/lib/finance/transaction-access';

describe('finance transaction access helpers', () => {
  it('formats actor names safely', () => {
    expect(
      getFinanceUserDisplayName({
        firstName: 'Jane',
        lastName: 'Doe',
      })
    ).toBe('Jane Doe');
    expect(getFinanceUserDisplayName({ firstName: 'Jane', lastName: '' })).toBe(
      'Jane'
    );
    expect(getFinanceUserDisplayName(undefined)).toBeUndefined();
  });

  it('treats only pending and completed transactions as mutable', () => {
    expect(isFinancialTransactionMutable('PENDING')).toBe(true);
    expect(isFinancialTransactionMutable('COMPLETED')).toBe(true);
    expect(isFinancialTransactionMutable('APPROVED')).toBe(false);
    expect(isFinancialTransactionMutable('REJECTED')).toBe(false);
    expect(isFinancialTransactionMutable('CANCELLED')).toBe(false);
  });

  it('allows admins to edit any mutable transaction and managers only their own mutable transaction', () => {
    const mutableTransaction = {
      createdBy: 7,
      status: 'PENDING',
    };
    const immutableTransaction = {
      createdBy: 7,
      status: 'APPROVED',
    };

    expect(
      canUserEditFinancialTransaction('ADMIN', '1', mutableTransaction)
    ).toBe(true);
    expect(
      canUserEditFinancialTransaction('ADMIN', '1', immutableTransaction)
    ).toBe(false);
    expect(
      canUserEditFinancialTransaction('MANAGER', '7', mutableTransaction)
    ).toBe(true);
    expect(
      canUserEditFinancialTransaction('MANAGER', '6', mutableTransaction)
    ).toBe(false);
    expect(
      canUserEditFinancialTransaction('MANAGER', '7', immutableTransaction)
    ).toBe(false);
  });
});
