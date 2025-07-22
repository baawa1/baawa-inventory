import React from "react";
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
import { UpdatePurchaseOrderFormData } from "./types";

interface DeliveryDatesSectionProps {
  form: UseFormReturn<UpdatePurchaseOrderFormData>;
}

export function DeliveryDatesSection({ form }: DeliveryDatesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Dates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expectedDeliveryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Delivery Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="actualDeliveryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Delivery Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" value={field.value || ""} />
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
