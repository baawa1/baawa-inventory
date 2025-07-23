import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { updatePurchaseOrderSchema } from "@/lib/validations/purchase-order";

type UpdatePurchaseOrderFormData = z.infer<typeof updatePurchaseOrderSchema>;

interface StatusNotesSectionProps {
  form: UseFormReturn<UpdatePurchaseOrderFormData>;
}

export function StatusNotesSection({ form }: StatusNotesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Notes</h3>
      </div>
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
    </div>
  );
}
