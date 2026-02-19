import {
  formatCurrency,
  getFinancialSummary,
  calculatePercentageChange,
  getDateRangeForPeriod,
} from '@/lib/utils/finance';

const formatDateParts = (date: Date) => ({
  year: date.getFullYear(),
  month: date.getMonth(),
  day: date.getDate(),
});

describe('finance utils', () => {
  it('formats currency with null/invalid values', () => {
    expect(formatCurrency(null)).toBe('₦0.00');
    expect(formatCurrency(undefined)).toBe('₦0.00');
    expect(formatCurrency('not-a-number')).toBe('₦0.00');
  });

  it('formats currency with numeric values', () => {
    expect(formatCurrency(1000)).toBe('₦1,000.00');
    expect(formatCurrency('2500')).toBe('₦2,500.00');
  });

  it('summarizes financial transactions', () => {
    const summary = getFinancialSummary([
      {
        id: 1,
        type: 'INCOME',
        amount: 5000,
        status: 'APPROVED',
      },
      {
        id: 2,
        type: 'EXPENSE',
        amount: 1200,
        status: 'APPROVED',
      },
      {
        id: 3,
        type: 'INCOME',
        amount: 300,
        status: 'PENDING',
      },
    ]);

    expect(summary.totalIncome).toBe(5300);
    expect(summary.totalExpense).toBe(1200);
    expect(summary.netAmount).toBe(4100);
    expect(summary.transactionCount).toBe(3);
  });

  it('calculates percentage changes', () => {
    expect(calculatePercentageChange(50, 0)).toBe(100);
    expect(calculatePercentageChange(0, 0)).toBe(0);
    expect(calculatePercentageChange(120, 100)).toBe(20);
    expect(calculatePercentageChange(80, 100)).toBe(-20);
  });

  it('generates date ranges by period', () => {
    const referenceDate = new Date(2025, 4, 15); // May 15, 2025

    const monthly = getDateRangeForPeriod('MONTHLY', referenceDate);
    expect(formatDateParts(monthly.startDate)).toEqual({
      year: 2025,
      month: 4,
      day: 1,
    });
    expect(formatDateParts(monthly.endDate)).toEqual({
      year: 2025,
      month: 4,
      day: 31,
    });

    const quarterly = getDateRangeForPeriod('QUARTERLY', referenceDate);
    expect(formatDateParts(quarterly.startDate)).toEqual({
      year: 2025,
      month: 3,
      day: 1,
    });
    expect(formatDateParts(quarterly.endDate)).toEqual({
      year: 2025,
      month: 5,
      day: 30,
    });

    const yearly = getDateRangeForPeriod('YEARLY', referenceDate);
    expect(formatDateParts(yearly.startDate)).toEqual({
      year: 2025,
      month: 0,
      day: 1,
    });
    expect(formatDateParts(yearly.endDate)).toEqual({
      year: 2025,
      month: 11,
      day: 31,
    });
  });
});
