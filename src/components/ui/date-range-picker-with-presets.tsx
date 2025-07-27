import * as React from 'react';
import { CalendarIcon } from '@radix-ui/react-icons';
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DateRangePickerWithPresetsProps {
  date?: DateRange;
  onDateChange?: (_date: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
  showCompare?: boolean;
  onCompareChange?: (
    _compare: 'previous_period' | 'previous_year' | null
  ) => void;
  compareValue?: 'previous_period' | 'previous_year' | null;
}

const PRESET_OPTIONS = [
  {
    label: 'Today',
    value: 'today',
    getRange: () => {
      const today = new Date();
      return { from: startOfDay(today), to: endOfDay(today) };
    },
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    },
  },
  {
    label: 'Week to date',
    value: 'week_to_date',
    getRange: () => {
      const now = new Date();
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfDay(now) };
    },
  },
  {
    label: 'Last week',
    value: 'last_week',
    getRange: () => {
      const now = new Date();
      const lastWeekStart = subDays(startOfWeek(now, { weekStartsOn: 1 }), 7);
      const lastWeekEnd = subDays(endOfWeek(now, { weekStartsOn: 1 }), 7);
      return { from: startOfDay(lastWeekStart), to: endOfDay(lastWeekEnd) };
    },
  },
  {
    label: 'Month to date',
    value: 'month_to_date',
    getRange: () => {
      const now = new Date();
      return { from: startOfMonth(now), to: endOfDay(now) };
    },
  },
  {
    label: 'Last month',
    value: 'last_month',
    getRange: () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    },
  },
  {
    label: 'Quarter to date',
    value: 'quarter_to_date',
    getRange: () => {
      const now = new Date();
      return { from: startOfQuarter(now), to: endOfDay(now) };
    },
  },
  {
    label: 'Last quarter',
    value: 'last_quarter',
    getRange: () => {
      const now = new Date();
      const lastQuarter = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3 - 3,
        1
      );
      return {
        from: startOfQuarter(lastQuarter),
        to: endOfQuarter(lastQuarter),
      };
    },
  },
  {
    label: 'Year to date',
    value: 'year_to_date',
    getRange: () => {
      const now = new Date();
      return { from: startOfYear(now), to: endOfDay(now) };
    },
  },
  {
    label: 'Last year',
    value: 'last_year',
    getRange: () => {
      const now = new Date();
      const lastYear = new Date(now.getFullYear() - 1, 0, 1);
      return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
    },
  },
];

export function DateRangePickerWithPresets({
  date,
  onDateChange,
  className,
  placeholder = 'Pick a date range',
  showCompare = false,
  onCompareChange,
  compareValue = null,
}: DateRangePickerWithPresetsProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(date);
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(
    null
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [pendingDateRange, setPendingDateRange] = React.useState<
    DateRange | undefined
  >(date);
  const [pendingPreset, setPendingPreset] = React.useState<string | null>(null);

  // Update internal state when external date changes
  React.useEffect(() => {
    setDateRange(date);
    setPendingDateRange(date);
  }, [date]);

  const handleDateChange = (newDate: DateRange | undefined) => {
    setPendingDateRange(newDate);
    setPendingPreset(null); // Clear preset when custom date is selected
  };

  const handlePresetSelect = (presetValue: string) => {
    const preset = PRESET_OPTIONS.find(p => p.value === presetValue);
    if (preset) {
      const newRange = preset.getRange();
      setPendingDateRange(newRange);
      setPendingPreset(presetValue);
    }
  };

  const handleUpdate = () => {
    // Apply the pending changes
    setDateRange(pendingDateRange);
    setSelectedPreset(pendingPreset);
    onDateChange?.(pendingDateRange);
    setIsOpen(false);
  };

  const handleCompareChange = (
    value: 'previous_period' | 'previous_year' | null
  ) => {
    onCompareChange?.(value);
  };

  const handleCancel = () => {
    // Reset pending changes to current values
    setPendingDateRange(dateRange);
    setPendingPreset(selectedPreset);
    setIsOpen(false);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'LLL dd, y')} -{' '}
                  {format(dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(dateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-4">
            <div className="mb-4">
              <h3 className="mb-2 text-lg font-semibold">
                SELECT A DATE RANGE
              </h3>

              <Tabs defaultValue="presets" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>

                <TabsContent value="presets" className="mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_OPTIONS.map(preset => (
                      <Button
                        key={preset.value}
                        variant={
                          pendingPreset === preset.value ? 'default' : 'outline'
                        }
                        size="sm"
                        className="h-auto justify-start px-3 py-2 text-left"
                        onClick={() => handlePresetSelect(preset.value)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{preset.label}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="mt-4">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={pendingDateRange?.from}
                    selected={pendingDateRange}
                    onSelect={handleDateChange}
                    numberOfMonths={2}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {showCompare && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-semibold">COMPARE TO</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={
                      compareValue === 'previous_period' ? 'default' : 'outline'
                    }
                    size="sm"
                    className="h-auto justify-start px-3 py-2 text-left"
                    onClick={() => handleCompareChange('previous_period')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Previous period</span>
                    </div>
                  </Button>
                  <Button
                    variant={
                      compareValue === 'previous_year' ? 'default' : 'outline'
                    }
                    size="sm"
                    className="h-auto justify-start px-3 py-2 text-left"
                    onClick={() => handleCompareChange('previous_year')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Previous year</span>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} size="sm" className="flex-1">
                Update
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
