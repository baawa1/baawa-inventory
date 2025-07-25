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
import { Textarea } from "@/components/ui/textarea";
import type { CreateIncomeData } from "./types";

interface AdditionalInfoSectionProps {
  form: UseFormReturn<CreateIncomeData>;
}

export function AdditionalInfoSection({ form }: AdditionalInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a description for this income transaction"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide details about this income transaction
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payer Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter payer name (optional)" {...field} />
              </FormControl>
              <FormDescription>
                Name of the person or entity who made this payment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
