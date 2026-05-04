import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';

export type FinanceComparisonPeriod =
  | 'custom'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year';

export interface FinanceRange {
  startDate: Date;
  endDate: Date;
  comparisonPeriod: FinanceComparisonPeriod;
}

export function normalizeFinanceBoundary(
  date: Date,
  boundary: 'start' | 'end'
): Date {
  const clonedDate = new Date(date);
  return boundary === 'start' ? startOfDay(clonedDate) : endOfDay(clonedDate);
}

export function normalizeFinanceDateFilters(
  startDate?: Date,
  endDate?: Date
): {
  startDate?: Date;
  endDate?: Date;
} {
  return {
    startDate: startDate
      ? normalizeFinanceBoundary(startDate, 'start')
      : undefined,
    endDate: endDate ? normalizeFinanceBoundary(endDate, 'end') : undefined,
  };
}

export function formatFinanceDateInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function buildFinanceRange(
  startDate?: Date,
  endDate?: Date,
  defaultPeriod: 'month' | 'year' = 'month',
  options?: {
    comparisonPeriod?: FinanceComparisonPeriod;
  }
): FinanceRange {
  const now = new Date();
  const defaultStart =
    defaultPeriod === 'year'
      ? new Date(now.getFullYear(), 0, 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);

  const resolvedStart = normalizeFinanceBoundary(
    startDate ?? defaultStart,
    'start'
  );
  const resolvedEnd = normalizeFinanceBoundary(endDate ?? now, 'end');

  return {
    startDate: resolvedStart,
    endDate: resolvedEnd,
    comparisonPeriod:
      options?.comparisonPeriod ??
      (startDate || endDate ? 'custom' : defaultPeriod),
  };
}

function spansWholeCalendarMonths(range: FinanceRange): boolean {
  return (
    range.startDate.getTime() === startOfMonth(range.startDate).getTime() &&
    range.endDate.getTime() === endOfMonth(range.endDate).getTime()
  );
}

function buildWholeMonthPreviousRange(range: FinanceRange): FinanceRange {
  const monthsSpanned =
    differenceInCalendarMonths(range.endDate, range.startDate) + 1;

  return {
    startDate: startOfMonth(subMonths(range.startDate, monthsSpanned)),
    endDate: endOfMonth(subMonths(range.endDate, monthsSpanned)),
    comparisonPeriod: range.comparisonPeriod,
  };
}

export function getPreviousFinanceRange(range: FinanceRange): FinanceRange {
  if (spansWholeCalendarMonths(range)) {
    return buildWholeMonthPreviousRange(range);
  }

  switch (range.comparisonPeriod) {
    case 'week':
      return {
        startDate: normalizeFinanceBoundary(subWeeks(range.startDate, 1), 'start'),
        endDate: normalizeFinanceBoundary(subWeeks(range.endDate, 1), 'end'),
        comparisonPeriod: range.comparisonPeriod,
      };
    case 'month':
      return {
        startDate: normalizeFinanceBoundary(subMonths(range.startDate, 1), 'start'),
        endDate: normalizeFinanceBoundary(subMonths(range.endDate, 1), 'end'),
        comparisonPeriod: range.comparisonPeriod,
      };
    case 'quarter':
      return {
        startDate: normalizeFinanceBoundary(subMonths(range.startDate, 3), 'start'),
        endDate: normalizeFinanceBoundary(subMonths(range.endDate, 3), 'end'),
        comparisonPeriod: range.comparisonPeriod,
      };
    case 'year':
      return {
        startDate: normalizeFinanceBoundary(subYears(range.startDate, 1), 'start'),
        endDate: normalizeFinanceBoundary(subYears(range.endDate, 1), 'end'),
        comparisonPeriod: range.comparisonPeriod,
      };
    case 'custom':
    default: {
      const totalDays =
        differenceInCalendarDays(range.endDate, range.startDate) + 1;

      return {
        startDate: normalizeFinanceBoundary(
          subDays(range.startDate, totalDays),
          'start'
        ),
        endDate: normalizeFinanceBoundary(subDays(range.startDate, 1), 'end'),
        comparisonPeriod: range.comparisonPeriod,
      };
    }
  }
}
