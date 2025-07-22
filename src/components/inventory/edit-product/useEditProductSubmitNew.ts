import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { UpdateProductFormData } from "./types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export function useEditProductSubmit(
  productId: number,
  _form: UseFormReturn<UpdateProductFormData>
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

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
        // New fields
        unit: data.unit || "piece",
        weight:
          data.weight !== undefined && data.weight !== null
            ? Number(data.weight)
            : null,
        dimensions: data.dimensions || null,
        color: data.color || null,
        size: data.size || null,
        material: data.material || null,
        tags: data.tags || [],
        salePrice: data.salePrice || null,
        saleStartDate: data.saleStartDate
          ? data.saleStartDate.toISOString()
          : null,
        saleEndDate: data.saleEndDate ? data.saleEndDate.toISOString() : null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        seoKeywords: data.seoKeywords || [],
        isFeatured: data.isFeatured || false,
        sortOrder: data.sortOrder || null,
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

      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-metrics"] });

      router.push("/inventory/products");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
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
