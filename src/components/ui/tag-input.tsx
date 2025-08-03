'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (_tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Type and press Enter to add tags...',
  maxTags = 10,
  disabled = false,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="border-input flex min-h-[2.5rem] flex-wrap gap-2 rounded-md border bg-transparent p-2">
        {value.map((tag, index) => (
          <Badge
            key={`${tag}-${index}`}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1"
          >
            <span className="text-xs">{tag}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => removeTag(tag)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            value.length >= maxTags ? 'Max tags reached' : placeholder
          }
          disabled={disabled || value.length >= maxTags}
          className="min-w-[120px] flex-1 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      {value.length >= maxTags && (
        <p className="text-muted-foreground text-xs">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
}
