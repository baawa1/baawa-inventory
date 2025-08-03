import { UseFormReturn } from 'react-hook-form';
import { UpdateProductFormData } from './types';
import { toast } from 'sonner';

export function useEditProductSubmit(
  productId: number,
  setIsSubmitting: (_loading: boolean) => void,
  setSubmitError: (_error: string | null) => void,
  onSuccess: () => void
) {
  const onSubmit = async (
    data: UpdateProductFormData,
    _form: UseFormReturn<UpdateProductFormData>
  ) => {
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
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }

      toast.success('Product updated successfully');
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit };
}
