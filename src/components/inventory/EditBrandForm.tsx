"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateBrandFormSchema,
  type UpdateBrandFormData,
} from "@/lib/validations/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormLoading } from "@/components/ui/form-loading";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { useBrandById, useUpdateBrand } from "@/hooks/api/brands";

interface EditBrandFormProps {
  brandId: number;
}

export default function EditBrandForm({ brandId }: EditBrandFormProps) {
  const router = useRouter();
  const [_serverError, setServerError] = useState<string | null>(null);

  // TanStack Query hooks
  const { data: brand, isLoading, error: _error } = useBrandById(brandId);

  const updateBrandMutation = useUpdateBrand();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset: _reset,
    formState: { errors },
  } = useForm<UpdateBrandFormData>({
    resolver: zodResolver(updateBrandFormSchema),
    values: brand
      ? {
          id: brand.id,
          name: brand.name,
          description: brand.description,
          image: brand.image,
          website: brand.website,
          isActive: brand.is_active,
        }
      : undefined,
  });

  const isActive = watch("isActive");

  const onSubmit = async (data: UpdateBrandFormData) => {
    try {
      setServerError(null);

      // Clean up website URL
      if (data.website && data.website.trim() === "") {
        data.website = null;
      }

      // Transform form data to API format (isActive -> is_active)
      const apiData = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        image: data.image || undefined,
        website: data.website || undefined,
        is_active: data.isActive,
      };

      await updateBrandMutation.mutateAsync({ id: data.id, data: apiData });
      toast.success("Brand updated successfully!");
      router.push("/inventory/brands");
    } catch (error) {
      console.error("Error updating brand:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update brand";
      setServerError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <FormLoading
        title="Edit Brand"
        description="Loading brand information..."
        backLabel="Back to Brands"
        onBack={() => router.push("/inventory/brands")}
        backUrl="/inventory/brands"
      />
    );
  }

  // Show loading state during update
  if (updateBrandMutation.isPending) {
    return (
      <FormLoading
        title="Edit Brand"
        description="Updating brand information..."
        backLabel="Back to Brands"
        onBack={() => router.push("/inventory/brands")}
        backUrl="/inventory/brands"
      />
    );
  }

  if (!brand) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/inventory/brands")}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Brands
        </Button>
        <PageHeader
          title="Edit Brand"
          description={`Update the details for "${brand.name}" brand`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand Information</CardTitle>
          <CardDescription>
            Update the details for this brand. Required fields are marked with
            an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Brand Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter brand name"
                disabled={updateBrandMutation.isPending}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Enter brand description (optional)"
                rows={3}
                disabled={updateBrandMutation.isPending}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <ImageUpload
              value={watch("image")}
              onChange={(url) => setValue("image", url)}
              onError={(error) => {
                // Handle error in form validation
                console.error("Image upload error:", error);
              }}
              label="Brand Image"
              placeholder="Upload a brand image"
              disabled={updateBrandMutation.isPending}
              folder="brands"
              alt="Brand image"
            />
            {errors.image && (
              <p className="text-sm text-destructive">{errors.image.message}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                type="url"
                {...register("website")}
                placeholder="https://example.com (optional)"
                disabled={updateBrandMutation.isPending}
              />
              {errors.website && (
                <p className="text-sm text-destructive">
                  {errors.website.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-base">
                  Active Status
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active brands will be available for product assignment.
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked)}
                disabled={updateBrandMutation.isPending}
              />
            </div>
            {errors.isActive && (
              <p className="text-sm text-destructive">
                {errors.isActive.message}
              </p>
            )}

            <div className="flex items-center gap-4 pt-4">
              <Button
                type="submit"
                disabled={updateBrandMutation.isPending}
                className="flex items-center gap-2"
              >
                {updateBrandMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {updateBrandMutation.isPending ? "Updating..." : "Update Brand"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/inventory/brands")}
                disabled={updateBrandMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
