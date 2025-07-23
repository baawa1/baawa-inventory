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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UpdatePurchaseOrderFormData } from "./types";
import { PURCHASE_ORDER_STATUS } from "@/lib/constants";

interface StatusNotesSectionProps {
  form: UseFormReturn<UpdatePurchaseOrderFormData>;
}

const PURCHASE_ORDER_STATUSES = [
  { value: PURCHASE_ORDER_STATUS.DRAFT, label: "Draft" },
  { value: PURCHASE_ORDER_STATUS.PENDING, label: "Pending" },
  { value: PURCHASE_ORDER_STATUS.APPROVED, label: "Approved" },
  { value: PURCHASE_ORDER_STATUS.ORDERED, label: "Ordered" },
  { value: PURCHASE_ORDER_STATUS.PARTIAL_RECEIVED, label: "Partial Received" },
  { value: PURCHASE_ORDER_STATUS.RECEIVED, label: "Received" },
  { value: PURCHASE_ORDER_STATUS.CANCELLED, label: "Cancelled" },
];

export function StatusNotesSection({ form }: StatusNotesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status & Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PURCHASE_ORDER_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
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
                  {...field}
                  value={field.value || ""}
                  placeholder="Add any additional notes..."
                  rows={4}
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
