"use client";

import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const purchasePrice = form.watch("purchasePrice");
  const sellingPrice = form.watch("sellingPrice");

  const calculateMargin = () => {
    if (purchasePrice && sellingPrice && purchasePrice > 0) {
      const margin = ((sellingPrice - purchasePrice) / sellingPrice) * 100;
      return margin.toFixed(2);
    }
    return "0.00";
  };

  const calculateMarkup = () => {
    if (purchasePrice && sellingPrice && purchasePrice > 0) {
      const markup = ((sellingPrice - purchasePrice) / purchasePrice) * 100;
      return markup.toFixed(2);
    }
    return "0.00";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing & Inventory</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
                    value={
                      field.value === 0 ? "" : field.value?.toString() || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseFloat(value) : 0);
                    }}
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
                    value={
                      field.value === 0 ? "" : field.value?.toString() || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseFloat(value) : 0);
                    }}
                  />
                </FormControl>
                <FormDescription>Price to customers</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Profit Calculations */}
        {purchasePrice && sellingPrice && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Profit</p>
              <p className="font-semibold">
                {formatCurrency(sellingPrice - purchasePrice)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Margin</p>
              <p className="font-semibold">{calculateMargin()}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Markup</p>
              <p className="font-semibold">{calculateMarkup()}%</p>
            </div>
          </div>
        )}

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
                    value={
                      field.value === 0 ? "" : field.value?.toString() || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseInt(value) : 0);
                    }}
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
                    value={
                      field.value === 0 ? "" : field.value?.toString() || ""
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseInt(value) : 0);
                    }}
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
      </CardContent>
    </Card>
  );
}
