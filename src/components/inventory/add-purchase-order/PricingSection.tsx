"use client";

import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { CreatePurchaseOrderData } from "./types";

interface PricingSectionProps {
  form: UseFormReturn<CreatePurchaseOrderData>;
}

export function PricingSection({ form }: PricingSectionProps) {
  const subtotal = form.watch("subtotal") || 0;
  const taxAmount = form.watch("taxAmount") || 0;
  const shippingCost = form.watch("shippingCost") || 0;

  // Calculate total amount
  const totalAmount = subtotal + taxAmount + shippingCost;

  // Update total amount when any of the components change
  useEffect(() => {
    form.setValue("totalAmount", totalAmount);
  }, [subtotal, taxAmount, shippingCost, totalAmount, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="taxAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Amount (₦)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={field.value?.toString() || ""}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shippingCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipping Cost (₦)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={field.value?.toString() || ""}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
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
                <FormLabel>Total Amount (₦)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={field.value?.toString() || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    readOnly
                    className="bg-gray-50 font-semibold"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-4">
          <div className="space-y-2 text-right">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{formatCurrency(shippingCost)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
