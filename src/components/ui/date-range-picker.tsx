import type { ComponentProps } from 'react';
import { DateRangePickerWithPresets } from '@/components/ui/date-range-picker-with-presets';

type DateRangePickerProps = ComponentProps<typeof DateRangePickerWithPresets>;

export function DateRangePicker(props: DateRangePickerProps) {
  return <DateRangePickerWithPresets {...props} />;
}
