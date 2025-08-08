'use client';

import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { CreateProductData } from './types';

interface AdditionalInfoSectionProps {
  form: UseFormReturn<CreateProductData>;
}

export function AdditionalInfoSection({ form }: AdditionalInfoSectionProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'OUT_OF_STOCK':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DISCONTINUED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor('ACTIVE')}
                      >
                        Active
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor('INACTIVE')}
                      >
                        Inactive
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="OUT_OF_STOCK">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor('OUT_OF_STOCK')}
                      >
                        Out of Stock
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="DISCONTINUED">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor('DISCONTINUED')}
                      >
                        Discontinued
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this product"
                  className="resize-none"
                  rows={3}
                  {...field}
                  value={field.value || ''}
                  onChange={e => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
