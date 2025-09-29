import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MobileFilters } from '@/components/ui/mobile-filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconArrowsSort, IconSearch } from '@tabler/icons-react';
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
  type: 'select' | 'text' | 'boolean' | 'date';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyLabel?: string;
}

interface MobileDashboardFiltersBarProps {
  title?: string;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isSearching?: boolean;
  filters?: FilterConfig[];
  filterValues?: Record<string, any>;
  onFilterChange?: (key: string, value: any) => void;
  onResetFilters?: () => void;
  quickFilters?: React.ReactNode;
  sortOptions?: Array<{ label: string; value: string }>;
  currentSort?: string;
  onSortChange?: (value: string) => void;
}

export function MobileDashboardFiltersBar({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  isSearching = false,
  filters = [],
  filterValues = {},
  onFilterChange = () => {},
  onResetFilters = () => {},
  quickFilters,
  sortOptions = [],
  currentSort = '',
  onSortChange = () => {},
}: MobileDashboardFiltersBarProps) {
  return (
    <Card className="dark:bg-card bg-white">
      <CardContent className="p-2 md:p-4 lg:p-6">
        {/* Desktop Layout - Hidden on mobile */}
        <div className="hidden md:block">
          <div className="flex flex-col gap-4">
            {/* Search and Sort Row */}
            <div className="flex items-center justify-between gap-4">
              {/* Left side: Search Bar and Quick Filters */}
              <div className="flex items-center gap-4">
                <div className="relative w-80">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="pl-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                  )}
                </div>

                {/* Quick Filters beside search */}
                {quickFilters && (
                  <div className="flex items-center gap-2">
                    {quickFilters}
                  </div>
                )}
              </div>

              {/* Right side: Sort Dropdown */}
              {sortOptions.length > 0 && (
                <Select value={currentSort} onValueChange={onSortChange}>
                  <SelectTrigger className="w-[200px]">
                    <IconArrowsSort className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Desktop Filters Row */}
            {filters.length > 0 && (
              <div className="flex items-center gap-4 flex-wrap">
                {filters.map((filter) => (
                  <div key={filter.key} className="min-w-[150px]">
                    {filter.type === 'select' && (
                      filter.searchable ? (
                        <SearchableSelect
                          value={filterValues[filter.key] || ''}
                          onChange={(value) => onFilterChange(filter.key, value)}
                          options={filter.options || []}
                          placeholder={filter.placeholder || filter.label}
                          searchPlaceholder={
                            filter.searchPlaceholder || `Search ${filter.label}...`
                          }
                          emptyMessage={
                            filter.emptyMessage ||
                            `No ${filter.label.toLowerCase()} found`
                          }
                          emptySelectionLabel={
                            filter.emptyLabel || `All ${filter.label}`
                          }
                        />
                      ) : (
                        <Select
                          value={filterValues[filter.key] || ''}
                          onValueChange={(value) =>
                            onFilterChange(filter.key, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={filter.placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {filter.options?.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                    )}
                  </div>
                ))}
                
                {/* Reset Filters Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetFilters}
                  className="whitespace-nowrap"
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Layout - Hidden on desktop */}
        <div className="md:hidden">
          <MobileFilters
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            isSearching={isSearching}
            filters={filters}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            onResetFilters={onResetFilters}
            quickFilters={quickFilters}
          />

          {/* Sort Options - Mobile */}
          {sortOptions.length > 0 && (
            <div className="flex items-center justify-between gap-4 mt-4">
              <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                Sort by:
              </span>
              <Select value={currentSort} onValueChange={onSortChange}>
                <SelectTrigger className="flex-1 max-w-[200px]">
                  <IconArrowsSort className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Choose sort order" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default MobileDashboardFiltersBar;
