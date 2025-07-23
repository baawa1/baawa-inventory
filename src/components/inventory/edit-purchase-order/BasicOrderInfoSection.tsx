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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconBuilding,
  IconCalendar,
  IconStatusChange,
} from "@tabler/icons-react";
import { z } from "zod";
import { updatePurchaseOrderSchema } from "@/lib/validations/purchase-order";
import { PURCHASE_ORDER_STATUS } from "@/lib/constants";

type UpdatePurchaseOrderFormData = z.infer<typeof updatePurchaseOrderSchema>;

interface FormOption {
  value: string;
  label: string;
}

interface BasicOrderInfoSectionProps {
  form: UseFormReturn<UpdatePurchaseOrderFormData>;
  suppliers: FormOption[];
  loadingSuppliers: boolean;
}

export function BasicOrderInfoSection({
  form,
  suppliers,
  loadingSuppliers,
}: BasicOrderInfoSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <IconBuilding className="h-4 w-4" />
                Supplier *
              </FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
                disabled={loadingSuppliers}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.value} value={supplier.value}>
                      {supplier.label}
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
          name="orderNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Number *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., PO-2024-001" disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="orderDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <IconCalendar className="h-4 w-4" />
                Order Date *
              </FormLabel>
              <FormControl>
                <Input {...field} type="date" placeholder="Select order date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <IconStatusChange className="h-4 w-4" />
                Status *
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(PURCHASE_ORDER_STATUS).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {key.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
