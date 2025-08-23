import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { hasPermission } from '@/lib/auth/roles';
import { useSession } from 'next-auth/react';
import { UpdateProductFormData } from './types';

interface PricingInventorySectionProps {
  form: UseFormReturn<UpdateProductFormData>;
}

export function PricingInventorySection({
  form,
}: PricingInventorySectionProps) {
  const { data: session } = useSession();
  const canViewCost = hasPermission(session?.user?.role, 'PRODUCT_COST_READ');
  const canViewPrice = hasPermission(session?.user?.role, 'PRODUCT_PRICE_READ');
  
  const purchasePrice = form.watch('purchasePrice');
  const sellingPrice = form.watch('sellingPrice');

  const calculateMargin = () => {
    if (purchasePrice && sellingPrice && purchasePrice > 0) {
      const margin = ((sellingPrice - purchasePrice) / sellingPrice) * 100;
      return margin.toFixed(2);
    }
    return '0.00';
  };

  const calculateMarkup = () => {
    if (purchasePrice && sellingPrice && purchasePrice > 0) {
      const markup = ((sellingPrice - purchasePrice) / purchasePrice) * 100;
      return markup.toFixed(2);
    }
    return '0.00';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing & Inventory</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Only show pricing fields if user has permissions */}
        {(canViewCost || canViewPrice) && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {canViewCost && (
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        onChange={e => {
                          const value = e.target.value;
                          field.onChange(value ? parseFloat(value) : undefined);
                        }}
                        value={field.value?.toString() || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {canViewPrice && (
              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        onChange={e => {
                          const value = e.target.value;
                          field.onChange(value ? parseFloat(value) : undefined);
                        }}
                        value={field.value?.toString() || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        {/* Profit Calculations - Only show if user can see both cost and price */}
        {canViewCost && canViewPrice && purchasePrice && sellingPrice && (
          <div className="bg-muted border-border grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Profit</p>
              <p className="font-semibold">
                {formatCurrency(sellingPrice - purchasePrice)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Margin</p>
              <p className="font-semibold">{calculateMargin()}%</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Markup</p>
              <p className="font-semibold">{calculateMarkup()}%</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="currentStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Stock *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    placeholder="0"
                    onChange={e => {
                      const value = e.target.value;
                      field.onChange(value ? parseInt(value) : undefined);
                    }}
                    value={field.value?.toString() || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minimumStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Stock *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    placeholder="0"
                    onChange={e => {
                      const value = e.target.value;
                      field.onChange(value ? parseInt(value) : undefined);
                    }}
                    value={field.value?.toString() || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maximumStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Stock</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    placeholder="0"
                    onChange={e => {
                      const value = e.target.value;
                      field.onChange(value ? parseInt(value) : null);
                    }}
                    value={field.value?.toString() || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
