"use client";

import { UseFormReturn } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CreateProductData } from "./types";

export function useProductSubmit(
  form: UseFormReturn<CreateProductData>,
  setIsSubmitting: (value: boolean) => void,
  setSubmitError: (error: string | null) => void
) {
  const router = useRouter();

  const onSubmit = async (data: CreateProductData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Convert empty strings to null for optional fields
      const cleanedData = {
        ...data,
        description: data.description?.trim() || null,
        barcode: data.barcode?.trim() || null,
        imageUrl: data.imageUrl?.trim() || null,
        notes: data.notes?.trim() || null,
        maximumStock: data.maximumStock || null,
      };

      // Debug logging removed for production

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create product");
      }

      const _result = await response.json();
      // Debug logging removed for production

      // Show success notification
      toast.success("Product created successfully!");

      // Redirect to products list
      router.push("/inventory/products");
    } catch (error) {
      console.error("Error creating product:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit };
}
