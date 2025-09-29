'use client';

import * as React from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value?: string;
  onChange: (_value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptySelectionLabel?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found',
  emptySelectionLabel,
  disabled = false,
  className,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  const normalizedValue = value ?? '';
  const selectedOption = React.useMemo(
    () => options.find(option => option.value === normalizedValue),
    [normalizedValue, options]
  );

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-between px-3',
            triggerClassName,
            className
          )}
        >
          <span
            className={cn(
              'truncate text-sm',
              !selectedOption && 'text-muted-foreground'
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {typeof emptySelectionLabel === 'string' && (
                <CommandItem
                  value=""
                  onSelect={() => handleSelect('')}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      normalizedValue === '' ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {emptySelectionLabel}
                </CommandItem>
              )}
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      option.value === normalizedValue
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default SearchableSelect;
