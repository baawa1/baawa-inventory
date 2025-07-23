import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCurrency, IconCalculator } from "@tabler/icons-react";
import { UpdatePurchaseOrderFormData } from "./types";
import { formatCurrency } from "@/lib/utils";

interface FinancialInfoSectionProps {
  form: UseFormReturn<UpdatePurchaseOrderFormData>;
}

export function FinancialInfoSection({ form }: FinancialInfoSectionProps) {
  // Watch values for calculations
  const subtotal = form.watch("subtotal") || 0;
  const taxAmount = form.watch("taxAmount") || 0;
  const shippingCost = form.watch("shippingCost") || 0;
  const calculatedTotal = subtotal + taxAmount + shippingCost;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCurrency className="h-5 w-5" />
          Financial Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="subtotal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subtotal *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseFloat(value) : 0);
                    }}
                    value={field.value?.toString() || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taxAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Amount</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseFloat(value) : 0);
                    }}
                    value={field.value?.toString() || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="shippingCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipping Cost</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseFloat(value) : 0);
                    }}
                    value={field.value?.toString() || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value ? parseFloat(value) : 0);
                    }}
                    value={field.value?.toString() || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Calculated Total Display */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <IconCalculator className="h-4 w-4" />
            <span className="font-medium">Calculated Total:</span>
          </div>
          <div className="text-lg font-bold text-primary">
            {formatCurrency(calculatedTotal)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Subtotal: {formatCurrency(subtotal)} + Tax:{" "}
            {formatCurrency(taxAmount)} + Shipping:{" "}
            {formatCurrency(shippingCost)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
