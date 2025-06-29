"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { CreateProductData } from "./types";

interface PricingInventorySectionProps {
  form: UseFormReturn<CreateProductData>;
}

export function PricingInventorySection({
  form,
}: PricingInventorySectionProps) {
  return (
    <div className="space-y-4">
      {/* Pricing Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="purchasePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Price *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormDescription>Cost price from supplier</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sellingPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Selling Price *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormDescription>Price to customers</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Profit Margin Display */}
      {form.watch("purchasePrice") > 0 && form.watch("sellingPrice") > 0 && (
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span>Profit Margin:</span>
            <span className="font-medium">
              {formatCurrency(
                form.watch("sellingPrice") - form.watch("purchasePrice")
              )}
              (
              {(
                ((form.watch("sellingPrice") - form.watch("purchasePrice")) /
                  form.watch("purchasePrice")) *
                100
              ).toFixed(1)}
              %)
            </span>
          </div>
        </div>
      )}

      {/* Inventory Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="currentStock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Stock *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormDescription>Current quantity in stock</FormDescription>
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
                  type="number"
                  min="0"
                  placeholder="0"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormDescription>Alert when stock is low</FormDescription>
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
                  type="number"
                  min="0"
                  placeholder="100"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                />
              </FormControl>
              <FormDescription>Maximum stock capacity</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
