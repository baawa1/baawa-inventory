import React, { useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'boolean' | 'text' | 'date';
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyLabel?: string;
}

interface DashboardFiltersBarProps {
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (_value: string) => void;
  isSearching?: boolean;
  filters?: FilterConfig[];
  filterValues?: Record<string, any>;
  onFilterChange?: (_key: string, _value: any) => void;
  onResetFilters?: () => void;
  quickFilters?: React.ReactNode;
  sortOptions?: Array<{ label: string; value: string }>;
  currentSort?: string;
  onSortChange?: (_value: string) => void;
}

export function DashboardFiltersBar({
  title = 'Filters & Search',
  description,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange = () => {},
  isSearching = false,
  filters = [],
  filterValues = {},
  onFilterChange = () => {},
  onResetFilters = () => {},
  quickFilters,
  sortOptions = [],
  currentSort = '',
  onSortChange = () => {},
}: DashboardFiltersBarProps) {
  const renderFilterControl = useCallback(
    (filter: FilterConfig) => {
      const value = filterValues[filter.key] || '';
      switch (filter.type) {
        case 'select':
          if (filter.searchable) {
            return (
              <SearchableSelect
                value={value}
                onChange={(val: string) => onFilterChange(filter.key, val)}
                options={filter.options || []}
                placeholder={filter.placeholder || filter.label}
                searchPlaceholder={
                  filter.searchPlaceholder || `Search ${filter.label}...`
                }
                emptyMessage={
                  filter.emptyMessage || `No ${filter.label.toLowerCase()} found`
                }
                emptySelectionLabel={
                  filter.emptyLabel || `All ${filter.label}`
                }
                triggerClassName="min-w-[200px]"
              />
            );
          }
          return (
            <Select
              value={value === '' ? 'all' : value}
              onValueChange={(val: string) => {
                const newValue = val === 'all' ? '' : val;
                onFilterChange(filter.key, newValue);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={filter.placeholder || filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case 'boolean':
          return (
            <Button
              variant={value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange(filter.key, !value)}
            >
              {filter.label}
            </Button>
          );
        case 'text':
          return (
            <Input
              placeholder={filter.placeholder || filter.label}
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onFilterChange(filter.key, e.target.value)
              }
            />
          );
        case 'date':
          return (
            <Input
              type="date"
              placeholder={filter.placeholder || filter.label}
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onFilterChange(filter.key, e.target.value)
              }
            />
          );
        default:
          return null;
      }
    },
    [filterValues, onFilterChange]
  );

  return (
    <Card className="dark:bg-card mb-6 bg-white px-4 lg:px-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconFilter className="h-5 w-5" /> {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-start gap-4">
          <div className="relative">
            <IconSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onSearchChange(e.target.value)
              }
              className="pr-8 pl-9"
            />
            {isSearching && (
              <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          {filters.map(filter => (
            <div key={filter.key}>{renderFilterControl(filter)}</div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="py-4.5 whitespace-nowrap"
          >
            Reset Filters
          </Button>
          {sortOptions.length > 0 && onSortChange && (
            <div className="ml-auto flex items-center justify-center">
              <Select value={currentSort || ''} onValueChange={onSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {quickFilters && <div className="mt-4 flex gap-2">{quickFilters}</div>}
      </CardContent>
    </Card>
  );
}
