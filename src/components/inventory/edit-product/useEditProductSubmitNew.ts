import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { UpdateProductFormData } from "./types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useEditProductSubmit(
  productId: number,
  form: UseFormReturn<UpdateProductFormData>
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (data: UpdateProductFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare data for submission
      const submitData = {
        name: data.name,
        description: data.description || null,
        sku: data.sku,
        barcode: data.barcode || null,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        supplierId: data.supplierId || null,
        purchasePrice: data.purchasePrice || undefined,
        sellingPrice: data.sellingPrice || undefined,
        currentStock: data.currentStock || undefined,
        minimumStock: data.minimumStock || undefined,
        maximumStock: data.maximumStock || null,
        status: data.status,
        notes: data.notes || null,
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update product");
      }

      toast.success("Product updated successfully");
      router.push("/inventory/products");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update product";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitError,
    onSubmit,
  };
}
