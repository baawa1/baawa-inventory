import * as React from 'react';
import { CalendarIcon } from '@radix-ui/react-icons';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { addMonths, startOfMonth, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DATE_RANGE_PRESET_OPTIONS,
  DEFAULT_DATE_RANGE_PRESET,
  type DateRangePresetValue,
  formatDateRangeDisplay,
  getDateRangePreset,
  getDateRangePresetLabel,
  getMatchingDateRangePreset,
  hasCompleteDateRange,
  normalizeCalendarDateRange,
} from '@/lib/utils/date-range';

interface DateRangePickerWithPresetsProps {
  date?: DateRange;
  onDateChange?: (_date: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
  defaultPreset?: DateRangePresetValue;
  disableFuture?: boolean;
  presets?: DateRangePresetValue[];
}

export function DateRangePickerWithPresets(
  props: DateRangePickerWithPresetsProps
) {
  const {
    date,
    onDateChange,
    className,
    placeholder = 'Pick a date range',
    defaultPreset = DEFAULT_DATE_RANGE_PRESET,
    disableFuture = true,
    presets,
  } = props;
  const isControlled = Object.prototype.hasOwnProperty.call(props, 'date');
  const initialRange = React.useMemo(
    () => date ?? getDateRangePreset(defaultPreset),
    [date, defaultPreset]
  );
  const [internalDateRange, setInternalDateRange] = React.useState<
    DateRange | undefined
  >(initialRange);
  const [isOpen, setIsOpen] = React.useState(false);
  const [draftDateRange, setDraftDateRange] = React.useState<
    DateRange | undefined
  >(initialRange);
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(
    startOfMonth(initialRange?.from ?? new Date())
  );
  const isMobile = useIsMobile();
  const triggerId = React.useId();
  const referenceDate = React.useMemo(() => new Date(), [isOpen]);
  const selectedDateRange = isControlled ? date : internalDateRange;
  const presetOptions = React.useMemo(
    () =>
      presets?.length
        ? DATE_RANGE_PRESET_OPTIONS.filter(option =>
            presets.includes(option.value)
          )
        : DATE_RANGE_PRESET_OPTIONS,
    [presets]
  );
  const activePreset = React.useMemo(
    () => getMatchingDateRangePreset(selectedDateRange, referenceDate),
    [selectedDateRange, referenceDate]
  );
  const draftPreset = React.useMemo(
    () => getMatchingDateRangePreset(draftDateRange, referenceDate),
    [draftDateRange, referenceDate]
  );
  const defaultPresetLabel = getDateRangePresetLabel(defaultPreset);
  const triggerRangeLabel = formatDateRangeDisplay(selectedDateRange);

  React.useEffect(() => {
    if (isControlled) {
      setDraftDateRange(date);
    }
  }, [date, isControlled]);

  const applyDateRange = React.useCallback(
    (nextRange: DateRange | undefined) => {
      const normalizedRange = normalizeCalendarDateRange(nextRange);

      if (!isControlled) {
        setInternalDateRange(normalizedRange);
      }

      onDateChange?.(normalizedRange);
    },
    [isControlled, onDateChange]
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);

    if (nextOpen) {
      const nextRange = selectedDateRange ?? getDateRangePreset(defaultPreset);
      setDraftDateRange(nextRange);
      setCalendarMonth(startOfMonth(nextRange?.from ?? new Date()));
      return;
    }

    setDraftDateRange(selectedDateRange);
  };

  const handlePresetSelect = (presetValue: DateRangePresetValue) => {
    const nextRange = getDateRangePreset(presetValue, referenceDate);
    setDraftDateRange(nextRange);
    applyDateRange(nextRange);
    setIsOpen(false);
  };

  const handleDateChange = (nextRange: DateRange | undefined) => {
    const normalizedRange = normalizeCalendarDateRange(nextRange);
    setDraftDateRange(normalizedRange);

    if (normalizedRange?.from) {
      setCalendarMonth(startOfMonth(normalizedRange.from));
    }

    if (hasCompleteDateRange(normalizedRange)) {
      applyDateRange(normalizedRange);
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('grid min-w-[280px] gap-2', className)}>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            variant="outline"
            className={cn(
              'group/date-trigger h-auto w-full justify-start px-3 py-2 text-left font-normal',
              !selectedDateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mt-0.5 mr-1 h-4 w-4 shrink-0" />
            <div className="flex min-w-0 items-center gap-2">
              {selectedDateRange?.from ? (
                <>
                  <span className="shrink-0 text-sm font-medium">
                    {activePreset
                      ? getDateRangePresetLabel(activePreset)
                      : 'Custom range'}
                  </span>
                  <span className="text-muted-foreground truncate text-xs transition-colors group-hover/date-trigger:text-foreground/80">
                    {triggerRangeLabel}
                  </span>
                </>
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] p-0 sm:w-[680px] sm:max-w-[calc(100vw-2rem)]"
          align="end"
          sideOffset={8}
        >
          <div className="grid overflow-hidden lg:grid-cols-[180px_minmax(0,1fr)]">
            <div className="border-b p-3 lg:border-r lg:border-b-0">
              <div className="mb-3">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                  Quick Select
                </p>
              </div>
              <div className="grid gap-1.5">
                {presetOptions.map(option => (
                  <Button
                    key={option.value}
                    variant={draftPreset === option.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-auto items-start justify-start px-3 py-2 text-left"
                    onClick={() => handlePresetSelect(option.value)}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex min-w-0 flex-col">
              <div className="border-b px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Custom range</p>
                  </div>
                  <Badge variant={draftPreset ? 'secondary' : 'outline'}>
                    {draftPreset
                      ? getDateRangePresetLabel(draftPreset)
                      : 'Custom'}
                  </Badge>
                </div>
              </div>

              <div className="px-2 pb-2 sm:p-3">
                <Calendar
                  initialFocus
                  mode="range"
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  selected={draftDateRange}
                  onSelect={handleDateChange}
                  numberOfMonths={isMobile ? 1 : 2}
                  disabled={disableFuture ? { after: new Date() } : undefined}
                  className="w-full p-0 sm:p-3"
                  classNames={{
                    root: 'w-full',
                    months: 'flex w-full flex-col gap-6 md:flex-row',
                    month: 'w-full',
                    nav: 'hidden',
                    table: 'w-full table-fixed border-collapse',
                  }}
                />
              </div>

              <div className="border-t px-4 py-2">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCalendarMonth(current =>
                        startOfMonth(subMonths(current, 1))
                      )
                    }
                  >
                    <ChevronLeftIcon className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCalendarMonth(current =>
                        startOfMonth(addMonths(current, 1))
                      )
                    }
                  >
                    Next
                    <ChevronRightIcon className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {activePreset !== defaultPreset && (
                <div className="border-t px-4 py-2">
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePresetSelect(defaultPreset)}
                    >
                      Reset to {defaultPresetLabel}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
