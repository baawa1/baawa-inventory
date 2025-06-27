"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Package, AlertCircle } from "lucide-react";
import Link from "next/link";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductCombobox } from "@/components/inventory/ProductCombobox";
import { toast } from "sonner";

// Stock adjustment form schema
const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  type: z.enum(
    ["INCREASE", "DECREASE", "RECOUNT", "DAMAGE", "TRANSFER", "RETURN"],
    {
      required_error: "Adjustment type is required",
    }
  ),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .refine((val) => val !== 0, "Quantity cannot be zero"),
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

type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
  category: string;
}

const adjustmentTypes = [
  {
    value: "INCREASE",
    label: "Increase Stock",
    description: "Add items to inventory",
  },
  {
    value: "DECREASE",
    label: "Decrease Stock",
    description: "Remove items from inventory",
  },
  {
    value: "RECOUNT",
    label: "Stock Recount",
    description: "Adjust to actual counted quantity",
  },
  {
    value: "DAMAGE",
    label: "Damaged Items",
    description: "Remove damaged or unsellable items",
  },
  {
    value: "TRANSFER",
    label: "Transfer Out",
    description: "Items transferred to another location",
  },
  {
    value: "RETURN",
    label: "Return to Stock",
    description: "Items returned from customer or supplier",
  },
];

export function AddStockAdjustmentForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);

  const form = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      productId: "",
      type: undefined,
      quantity: 0,
      reason: "",
      notes: "",
      referenceNumber: "",
    },
  });

  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedProductId = watch("productId");
  const watchedType = watch("type");
  const watchedQuantity = watch("quantity");

  // Fetch products for selection
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch products without limit or with a reasonable limit
        const response = await fetch("/api/products?status=active");
        if (!response.ok) throw new Error("Failed to fetch products");

        const result = await response.json();
        setProducts(result.data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Update selected product when product ID changes
  useEffect(() => {
    if (watchedProductId) {
      const product = products.find(
        (p) => p.id.toString() === watchedProductId
      );
      setSelectedProduct(product || null);
    } else {
      setSelectedProduct(null);
    }
  }, [watchedProductId, products]);

  // Validate quantity based on adjustment type and current stock
  const validateQuantity = (
    quantity: number,
    type: string,
    currentStock: number
  ) => {
    if (type === "DECREASE" || type === "DAMAGE" || type === "TRANSFER") {
      if (Math.abs(quantity) > currentStock) {
        return `Cannot remove ${Math.abs(quantity)} items. Only ${currentStock} available in stock.`;
      }
    }
    if (type === "RECOUNT" && quantity < 0) {
      return "Recount quantity cannot be negative.";
    }
    return null;
  };

  const onSubmit = async (data: StockAdjustmentFormData) => {
    if (!session?.user?.id || !selectedProduct) {
      toast.error("Missing required information");
      return;
    }

    // Validate quantity against current stock
    const validationError = validateQuantity(
      data.quantity,
      data.type,
      selectedProduct.stock
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...data,
        productId: parseInt(data.productId),
        userId: session.user.id,
        quantity:
          data.type === "DECREASE" ||
          data.type === "DAMAGE" ||
          data.type === "TRANSFER"
            ? -Math.abs(data.quantity)
            : Math.abs(data.quantity),
      };

      const response = await fetch("/api/stock-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create stock adjustment");
      }

      const result = await response.json();
      toast.success("Stock adjustment created successfully");
      router.push("/inventory/stock-adjustments");
    } catch (error) {
      console.error("Error creating stock adjustment:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create stock adjustment"
      );
    } finally {
      setLoading(false);
    }
  };

  const getQuantityDisplay = () => {
    if (!watchedType || !watchedQuantity) return "";

    if (watchedType === "RECOUNT") {
      if (!selectedProduct) return "";
      const diff = watchedQuantity - selectedProduct.stock;
      return diff > 0 ? `+${diff}` : `${diff}`;
    }

    if (
      watchedType === "DECREASE" ||
      watchedType === "DAMAGE" ||
      watchedType === "TRANSFER"
    ) {
      return `-${Math.abs(watchedQuantity)}`;
    }

    return `+${Math.abs(watchedQuantity)}`;
  };

  const getNewStockLevel = () => {
    if (!selectedProduct || !watchedType || !watchedQuantity)
      return selectedProduct?.stock || 0;

    if (watchedType === "RECOUNT") {
      return watchedQuantity;
    }

    if (
      watchedType === "DECREASE" ||
      watchedType === "DAMAGE" ||
      watchedType === "TRANSFER"
    ) {
      return Math.max(0, selectedProduct.stock - Math.abs(watchedQuantity));
    }

    return selectedProduct.stock + Math.abs(watchedQuantity);
  };

  if (productsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Add Stock Adjustment</CardTitle>
          <CardDescription>Loading products...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory/stock-adjustments">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Stock Adjustments
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Stock Adjustment</CardTitle>
          <CardDescription>
            Adjust product stock levels with detailed reason tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Product Selection */}
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product *</FormLabel>
                    <FormControl>
                      <ProductCombobox
                        products={products}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Search and select a product to adjust"
                        emptyMessage="No products found. Try a different search term."
                        disabled={productsLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Current Stock Display */}
              {selectedProduct && (
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{selectedProduct.name}</strong> currently has{" "}
                    <strong>{selectedProduct.stock}</strong> units in stock.
                  </AlertDescription>
                </Alert>
              )}

              {/* Adjustment Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select adjustment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {adjustmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-gray-500">
                                {type.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantity */}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantity *
                      {watchedType === "RECOUNT"
                        ? " (New total stock count)"
                        : ` (${watchedType === "DECREASE" || watchedType === "DAMAGE" || watchedType === "TRANSFER" ? "Amount to remove" : "Amount to add"})`}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder={
                          watchedType === "RECOUNT"
                            ? "Enter new total stock count"
                            : "Enter quantity"
                        }
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    {watchedQuantity && selectedProduct && (
                      <FormDescription>
                        Change: <strong>{getQuantityDisplay()}</strong> | New
                        stock level: <strong>{getNewStockLevel()}</strong>
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why this adjustment is being made..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value.length}/500 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reference Number */}
              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Purchase order, transfer ID, etc. (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional reference number for tracking purposes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Additional Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information..."
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0}/1000 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex items-center gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Stock Adjustment"}
                </Button>
                <Link href="/inventory/stock-adjustments">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
