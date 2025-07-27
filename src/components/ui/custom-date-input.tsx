import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  subDays,
  subHours,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { DateRange } from 'react-day-picker';

interface CustomDateInputProps {
  onDateRangeChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function CustomDateInput({
  onDateRangeChange,
  placeholder = "Enter custom range (e.g., 'Last 7 days')",
  className,
}: CustomDateInputProps) {
  const [inputValue, setInputValue] = React.useState('');

  const parseCustomDateRange = (input: string): DateRange | null => {
    const lowerInput = input.toLowerCase().trim();

    // Parse "Last X days"
    const daysMatch = lowerInput.match(/last\s+(\d+)\s+days?/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      const end = endOfDay(new Date());
      const start = startOfDay(subDays(new Date(), days));
      return { from: start, to: end };
    }

    // Parse "Last X hours"
    const hoursMatch = lowerInput.match(/last\s+(\d+)\s+hours?/);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      const end = new Date();
      const start = subHours(new Date(), hours);
      return { from: start, to: end };
    }

    // Parse "Last X weeks"
    const weeksMatch = lowerInput.match(/last\s+(\d+)\s+weeks?/);
    if (weeksMatch) {
      const weeks = parseInt(weeksMatch[1]);
      const end = endOfDay(new Date());
      const start = startOfDay(subWeeks(new Date(), weeks));
      return { from: start, to: end };
    }

    // Parse "Last X months"
    const monthsMatch = lowerInput.match(/last\s+(\d+)\s+months?/);
    if (monthsMatch) {
      const months = parseInt(monthsMatch[1]);
      const end = endOfDay(new Date());
      const start = startOfDay(subMonths(new Date(), months));
      return { from: start, to: end };
    }

    // Parse "Today"
    if (lowerInput === 'today') {
      const today = new Date();
      return { from: startOfDay(today), to: endOfDay(today) };
    }

    // Parse "Yesterday"
    if (lowerInput === 'yesterday') {
      const yesterday = subDays(new Date(), 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    }

    // Parse "This week"
    if (lowerInput === 'this week') {
      const now = new Date();
      const start = startOfDay(subDays(now, now.getDay()));
      const end = endOfDay(new Date());
      return { from: start, to: end };
    }

    // Parse "This month"
    if (lowerInput === 'this month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endOfDay(new Date());
      return { from: start, to: end };
    }

    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleApply = () => {
    const parsedRange = parseCustomDateRange(inputValue);
    if (parsedRange) {
      onDateRangeChange(parsedRange);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Input
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        className="w-[250px]"
      />
      <Button onClick={handleApply} size="sm">
        Apply
      </Button>
    </div>
  );
}
