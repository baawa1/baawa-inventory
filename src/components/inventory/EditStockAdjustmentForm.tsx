"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
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
import { Textarea } from "@/components/ui/textarea";

// Edit stock adjustment form schema (limited to editable fields)
const editStockAdjustmentSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(500, "Reason must be 500 characters or less"),
  notes: z
    .string()
    .max(1000, "Notes must be 1000 characters or less")
    .optional(),
  referenceNumber: z
    .string()
    .max(100, "Reference number must be 100 characters or less")
    .optional(),
});

type EditStockAdjustmentFormData = z.infer<typeof editStockAdjustmentSchema>;

const ADJUSTMENT_TYPES = [
  { value: "INCREASE", label: "Stock Increase" },
  { value: "DECREASE", label: "Stock Decrease" },
  { value: "RECOUNT", label: "Stock Recount" },
  { value: "DAMAGE", label: "Damaged Items" },
  { value: "TRANSFER", label: "Stock Transfer" },
  { value: "RETURN", label: "Stock Return" },
] as const;

interface EditStockAdjustmentFormProps {
  adjustmentId: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
}

interface StockAdjustment {
  id: number;
  product_id: number;
  adjustment_type: string;
  quantity_change: number;
  reason: string;
  reference_number?: string;
  notes?: string;
  status: string;
  created_by: number;
  product?: Product;
}

export function EditStockAdjustmentForm({
  adjustmentId,
}: EditStockAdjustmentFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [adjustment, setAdjustment] = useState<StockAdjustment | null>(null);

  const form = useForm<EditStockAdjustmentFormData>({
    resolver: zodResolver(editStockAdjustmentSchema),
    defaultValues: {
      reason: "",
      referenceNumber: "",
      notes: "",
    },
  });

  // Fetch stock adjustment data
  useEffect(() => {
    const fetchAdjustment = async () => {
      try {
        const response = await fetch(`/api/stock-adjustments/${adjustmentId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch stock adjustment");
        }
        const data = await response.json();
        setAdjustment(data);

        // Update form with fetched data
        form.reset({
          reason: data.reason,
          referenceNumber: data.reference_number || "",
          notes: data.notes || "",
        });
      } catch (error) {
        console.error("Error fetching stock adjustment:", error);
        toast.error("Failed to load stock adjustment data");
        router.push("/inventory/stock-adjustments");
      } finally {
        setFetchingData(false);
      }
    };

    if (adjustmentId) {
      fetchAdjustment();
    }
  }, [adjustmentId, form, router]);

  const onSubmit = async (data: EditStockAdjustmentFormData) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to update stock adjustments");
      return;
    }

    // Check if adjustment can be edited (only PENDING status)
    if (adjustment?.status !== "PENDING") {
      toast.error("Only pending stock adjustments can be edited");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/stock-adjustments/${adjustmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update stock adjustment"
        );
      }

      toast.success("Stock adjustment updated successfully");
      router.push("/inventory/stock-adjustments");
    } catch (error) {
      console.error("Error updating stock adjustment:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update stock adjustment"
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Loading stock adjustment...
          </p>
        </div>
      </div>
    );
  }

  if (!adjustment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-medium">Stock adjustment not found</p>
          <p className="text-sm text-muted-foreground">
            The requested stock adjustment could not be found.
          </p>
          <Link
            href="/inventory/stock-adjustments"
            className="mt-4 inline-block"
          >
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Stock Adjustments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Only allow editing of PENDING adjustments
  if (adjustment.status !== "PENDING") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-medium">Cannot edit this adjustment</p>
          <p className="text-sm text-muted-foreground">
            Only pending stock adjustments can be edited. This adjustment is{" "}
            {adjustment.status.toLowerCase()}.
          </p>
          <Link
            href="/inventory/stock-adjustments"
            className="mt-4 inline-block"
          >
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Stock Adjustments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Link href="/inventory/stock-adjustments">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <CardTitle>Edit Stock Adjustment</CardTitle>
              <CardDescription>
                Update the stock adjustment details. Only reason, reference
                number, and notes can be modified.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display read-only information */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium">Adjustment Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Product:</span>{" "}
                {adjustment.product?.name || "Unknown"}
              </div>
              <div>
                <span className="font-medium">SKU:</span>{" "}
                {adjustment.product?.sku || "Unknown"}
              </div>
              <div>
                <span className="font-medium">Type:</span>{" "}
                {ADJUSTMENT_TYPES.find(
                  (t) => t.value === adjustment.adjustment_type
                )?.label || adjustment.adjustment_type}
              </div>
              <div>
                <span className="font-medium">Quantity:</span>{" "}
                {adjustment.quantity_change}
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain the reason for this stock adjustment"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="PO number, invoice, or other reference"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Link href="/inventory/stock-adjustments">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Stock Adjustment"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
