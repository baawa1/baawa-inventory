'use client';

import React, { useState, useEffect } from 'react';
import {
  useTopLevelCategories,
  useSubcategories,
} from '@/hooks/api/categories';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  IconChevronDown,
  IconChevronRight,
  IconFolder,
} from '@tabler/icons-react';

interface SubcategorySelectorProps {
  value?: number | null;
  onChange: (_value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  showTopLevel?: boolean;
}

interface CategoryOption {
  id: number;
  name: string;
  level: number;
  hasChildren: boolean;
}

export function SubcategorySelector({
  value,
  onChange,
  placeholder = 'Select category...',
  disabled = false,
  showTopLevel = true,
}: SubcategorySelectorProps) {
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);

  const { data: topLevelData, isLoading: topLevelLoading } =
    useTopLevelCategories();
  const { data: subcategoriesData, isLoading: subcategoriesLoading } =
    useSubcategories(selectedParentId || 0);

  // Build hierarchical category options
  useEffect(() => {
    const options: CategoryOption[] = [];

    if (showTopLevel && topLevelData?.data) {
      topLevelData.data.forEach(category => {
        options.push({
          id: category.id,
          name: category.name,
          level: 0,
          hasChildren: category.subcategoryCount > 0,
        });
      });
    }

    if (subcategoriesData?.data) {
      subcategoriesData.data.forEach(category => {
        options.push({
          id: category.id,
          name: category.name,
          level: 1,
          hasChildren: category.subcategoryCount > 0,
        });
      });
    }

    setCategoryOptions(options);
  }, [topLevelData, subcategoriesData, showTopLevel]);

  const handleCategoryClick = (categoryId: number, hasChildren: boolean) => {
    if (hasChildren) {
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        if (newSet.has(categoryId)) {
          newSet.delete(categoryId);
        } else {
          newSet.add(categoryId);
        }
        return newSet;
      });
      setSelectedParentId(categoryId);
    } else {
      onChange(categoryId);
    }
  };

  const isLoading = topLevelLoading || subcategoriesLoading;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Select
          value={value?.toString() || ''}
          onValueChange={val => onChange(val ? parseInt(val) : null)}
          disabled={disabled || isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {showTopLevel && (
              <SelectItem value="">
                <span className="text-muted-foreground">No category</span>
              </SelectItem>
            )}
            {categoryOptions.map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                <div className="flex items-center space-x-2">
                  <IconFolder className="h-4 w-4" />
                  <span>{category.name}</span>
                  {category.hasChildren && (
                    <Badge variant="secondary" className="text-xs">
                      Subcategories
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hierarchical Tree View */}
      <div className="max-h-60 overflow-y-auto rounded-md border p-2">
        {isLoading ? (
          <div className="text-muted-foreground py-4 text-center">
            Loading categories...
          </div>
        ) : (
          <div className="space-y-1">
            {showTopLevel &&
              topLevelData?.data?.map(category => (
                <div key={category.id} className="space-y-1">
                  <div
                    className={`hover:bg-accent flex cursor-pointer items-center space-x-2 rounded p-2 ${
                      value === category.id ? 'bg-accent' : ''
                    }`}
                    onClick={() =>
                      handleCategoryClick(
                        category.id,
                        category.subcategoryCount > 0
                      )
                    }
                  >
                    {category.subcategoryCount > 0 ? (
                      expandedCategories.has(category.id) ? (
                        <IconChevronDown className="h-4 w-4" />
                      ) : (
                        <IconChevronRight className="h-4 w-4" />
                      )
                    ) : (
                      <div className="w-4" />
                    )}
                    <IconFolder className="h-4 w-4" />
                    <span className="flex-1">{category.name}</span>
                    {category.subcategoryCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {category.subcategoryCount}
                      </Badge>
                    )}
                  </div>

                  {/* Subcategories */}
                  {expandedCategories.has(category.id) && category.children && (
                    <div className="ml-6 space-y-1">
                      {category.children.map(subcategory => (
                        <div
                          key={subcategory.id}
                          className={`hover:bg-accent flex cursor-pointer items-center space-x-2 rounded p-2 ${
                            value === subcategory.id ? 'bg-accent' : ''
                          }`}
                          onClick={() =>
                            handleCategoryClick(subcategory.id, false)
                          }
                        >
                          <div className="w-4" />
                          <IconFolder className="h-4 w-4" />
                          <span className="flex-1">{subcategory.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {subcategory.productCount || 0} products
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
