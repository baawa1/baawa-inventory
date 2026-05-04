import {
  buildFinanceRange,
  formatFinanceDateInput,
  getPreviousFinanceRange,
  normalizeFinanceDateFilters,
} from '@/lib/finance/date-range';

describe('finance date range helpers', () => {
  it('normalizes explicit filter dates to full-day boundaries', () => {
    const normalized = normalizeFinanceDateFilters(
      new Date('2026-04-01T12:30:00.000Z'),
      new Date('2026-04-30T08:15:00.000Z')
    );

    expect(formatFinanceDateInput(normalized.startDate!)).toBe('2026-04-01');
    expect(normalized.startDate?.getHours()).toBe(0);
    expect(normalized.startDate?.getMinutes()).toBe(0);

    expect(formatFinanceDateInput(normalized.endDate!)).toBe('2026-04-30');
    expect(normalized.endDate?.getHours()).toBe(23);
    expect(normalized.endDate?.getMinutes()).toBe(59);
    expect(normalized.endDate?.getSeconds()).toBe(59);
    expect(normalized.endDate?.getMilliseconds()).toBe(999);
  });

  it('compares full custom calendar months against the previous full month', () => {
    const aprilRange = buildFinanceRange(
      new Date('2026-04-01'),
      new Date('2026-04-30'),
      'month'
    );

    const previousRange = getPreviousFinanceRange(aprilRange);

    expect(formatFinanceDateInput(previousRange.startDate)).toBe('2026-03-01');
    expect(formatFinanceDateInput(previousRange.endDate)).toBe('2026-03-31');
  });

  it('compares month-to-date ranges against the same span in the previous month', () => {
    const mayToDateRange = buildFinanceRange(
      new Date(2026, 4, 1),
      new Date(2026, 4, 3),
      'month',
      { comparisonPeriod: 'month' }
    );

    const previousRange = getPreviousFinanceRange(mayToDateRange);

    expect(formatFinanceDateInput(previousRange.startDate)).toBe('2026-04-01');
    expect(formatFinanceDateInput(previousRange.endDate)).toBe('2026-04-03');
  });
});
