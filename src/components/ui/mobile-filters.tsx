'use client';

import * as React from 'react';
import { IconFilter, IconX, IconSearch } from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'boolean' | 'date';
  options?: FilterOption[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyLabel?: string;
}

export interface MobileFiltersProps {
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  isSearching?: boolean;

  // Filters
  filters: FilterConfig[];
  filterValues: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onResetFilters: () => void;

  // Quick filters (rendered outside the sheet)
  quickFilters?: React.ReactNode;

  // Styling
  className?: string;
}

export function MobileFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  isSearching = false,
  filters,
  filterValues,
  onFilterChange,
  onResetFilters,
  quickFilters,
  className,
}: MobileFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Count active filters
  const activeFiltersCount = React.useMemo(() => {
    return Object.entries(filterValues).filter(([key, value]) => {
      if (key === 'search') return false; // Don't count search as a filter
      if (typeof value === 'boolean') return value;
      return value !== '' && value !== null && value !== undefined;
    }).length;
  }, [filterValues]);

  const handleResetAndClose = () => {
    onResetFilters();
    setIsOpen(false);
  };

  const renderFilterInput = (filter: FilterConfig) => {
    const value = filterValues[filter.key];

    switch (filter.type) {
      case 'select':
        return filter.searchable ? (
          <SearchableSelect
            value={value || ''}
            onChange={newValue => onFilterChange(filter.key, newValue)}
            options={filter.options || []}
            placeholder={
              filter.placeholder || `Select ${filter.label.toLowerCase()}`
            }
            searchPlaceholder={
              filter.searchPlaceholder || `Search ${filter.label}...`
            }
            emptyMessage={
              filter.emptyMessage || `No ${filter.label.toLowerCase()} found`
            }
            emptySelectionLabel={filter.emptyLabel || `All ${filter.label}`}
          />
        ) : (
          <Select
            value={value || ''}
            onValueChange={newValue => onFilterChange(filter.key, newValue)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  filter.placeholder ||
                  `Select ${filter.label.toLowerCase()}`
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'text':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <Label htmlFor={`filter-${filter.key}`} className="text-sm font-medium">
              {filter.label}
            </Label>
            <Switch
              id={`filter-${filter.key}`}
              checked={value || false}
              onCheckedChange={(checked) => onFilterChange(filter.key, checked)}
            />
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-10 h-10"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          </div>
        )}
      </div>

      {/* Filter Actions Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Filter Button with Badge */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <IconFilter className="mr-2 h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          
          <SheetContent side="bottom" className="h-[90vh] p-0">
            <div className="flex flex-col h-full">
              <SheetHeader className="p-4 pb-2">
                <SheetTitle className="flex items-center justify-between">
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary">
                      {activeFiltersCount} active
                    </Badge>
                  )}
                </SheetTitle>
                <SheetDescription>
                  Refine your search results
                </SheetDescription>
              </SheetHeader>

              <Separator />

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  {filters.map((filter) => (
                    <div key={filter.key} className="space-y-2">
                      {filter.type !== 'boolean' && (
                        <Label className="text-sm font-medium">
                          {filter.label}
                        </Label>
                      )}
                      {renderFilterInput(filter)}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              <SheetFooter className="p-4 flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleResetAndClose}
                  className="flex-1"
                  disabled={activeFiltersCount === 0}
                >
                  <IconX className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
                <Button 
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Apply Filters
                </Button>
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>

        {/* Quick Filters */}
        {quickFilters && (
          <div className="flex-1 flex justify-end">
            {quickFilters}
          </div>
        )}
      </div>

      {/* Active Filters Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filterValues).map(([key, value]) => {
            if (key === 'search' || !value || (typeof value === 'string' && value === '')) {
              return null;
            }

            const filter = filters.find(f => f.key === key);
            if (!filter) return null;

            const displayValue = typeof value === 'boolean' 
              ? (value ? filter.label : null)
              : filter.options?.find(opt => opt.value === value)?.label || value;

            if (!displayValue) return null;

            return (
              <Badge 
                key={key} 
                variant="secondary" 
                className="flex items-center gap-1 pl-2 pr-1"
              >
                <span className="text-xs">{displayValue}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => onFilterChange(key, '')}
                >
                  <IconX className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MobileFilters;
