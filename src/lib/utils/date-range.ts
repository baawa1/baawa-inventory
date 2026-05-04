import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
} from 'date-fns';
import { DateRange } from 'react-day-picker';

export type DateRangePresetValue =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'month_to_date'
  | 'last_month'
  | 'quarter_to_date'
  | 'year_to_date';

export interface DateRangePresetOption {
  label: string;
  value: DateRangePresetValue;
  description: string;
}

export const DEFAULT_DATE_RANGE_PRESET: DateRangePresetValue = 'month_to_date';

export const DATE_RANGE_PRESET_OPTIONS: DateRangePresetOption[] = [
  { label: 'Today', value: 'today', description: 'Only today' },
  {
    label: 'Yesterday',
    value: 'yesterday',
    description: 'Previous day',
  },
  {
    label: 'Last 7 days',
    value: 'last_7_days',
    description: 'Rolling 7-day window',
  },
  {
    label: 'Last 30 days',
    value: 'last_30_days',
    description: 'Rolling 30-day window',
  },
  {
    label: 'Month to date',
    value: 'month_to_date',
    description: 'From the start of this month',
  },
  {
    label: 'Last month',
    value: 'last_month',
    description: 'Previous calendar month',
  },
  {
    label: 'Quarter to date',
    value: 'quarter_to_date',
    description: 'From the start of this quarter',
  },
  {
    label: 'Year to date',
    value: 'year_to_date',
    description: 'From the start of this year',
  },
];

export function formatCalendarDateInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function normalizeCalendarDateRange(
  range: DateRange | undefined
): DateRange | undefined {
  if (!range?.from) {
    return undefined;
  }

  return {
    from: startOfDay(range.from),
    to: range.to ? endOfDay(range.to) : undefined,
  };
}

export function hasCompleteDateRange(
  range: DateRange | undefined
): range is { from: Date; to: Date } {
  return !!range?.from && !!range?.to;
}

export function getDateRangePreset(
  preset: DateRangePresetValue,
  referenceDate = new Date()
): DateRange {
  switch (preset) {
    case 'today':
      return {
        from: startOfDay(referenceDate),
        to: endOfDay(referenceDate),
      };
    case 'yesterday': {
      const yesterday = subDays(referenceDate, 1);
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday),
      };
    }
    case 'last_7_days':
      return {
        from: startOfDay(subDays(referenceDate, 6)),
        to: endOfDay(referenceDate),
      };
    case 'last_30_days':
      return {
        from: startOfDay(subDays(referenceDate, 29)),
        to: endOfDay(referenceDate),
      };
    case 'month_to_date':
      return {
        from: startOfMonth(referenceDate),
        to: endOfDay(referenceDate),
      };
    case 'last_month': {
      const lastMonth = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() - 1,
        1
      );
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    }
    case 'quarter_to_date':
      return {
        from: startOfQuarter(referenceDate),
        to: endOfDay(referenceDate),
      };
    case 'year_to_date':
      return {
        from: startOfYear(referenceDate),
        to: endOfDay(referenceDate),
      };
    default:
      return {
        from: startOfMonth(referenceDate),
        to: endOfDay(referenceDate),
      };
  }
}

export function getDateRangePresetLabel(preset: DateRangePresetValue): string {
  return (
    DATE_RANGE_PRESET_OPTIONS.find(option => option.value === preset)?.label ??
    'Custom range'
  );
}

function areDateRangesEqual(
  left: DateRange | undefined,
  right: DateRange | undefined
): boolean {
  if (!left?.from || !right?.from) {
    return !left?.from && !right?.from && !left?.to && !right?.to;
  }

  if (!left.to || !right.to) {
    return isSameDay(left.from, right.from) && !left.to && !right.to;
  }

  return isSameDay(left.from, right.from) && isSameDay(left.to, right.to);
}

export function getMatchingDateRangePreset(
  range: DateRange | undefined,
  referenceDate = new Date()
): DateRangePresetValue | null {
  if (!hasCompleteDateRange(range)) {
    return null;
  }

  return (
    DATE_RANGE_PRESET_OPTIONS.find(option =>
      areDateRangesEqual(range, getDateRangePreset(option.value, referenceDate))
    )?.value ?? null
  );
}

export function formatDateRangeDisplay(
  range: DateRange | undefined
): string | null {
  if (!range?.from) {
    return null;
  }

  if (!range.to) {
    return format(range.from, 'LLL dd, y');
  }

  return `${format(range.from, 'LLL dd, y')} - ${format(range.to, 'LLL dd, y')}`;
}
