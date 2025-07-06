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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useBrandById, useUpdateBrand } from "@/hooks/api/brands";

interface Brand {
  id: number;
  name: string;
  description: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
        website: data.website || undefined,
        is_active: data.isActive,
      };

      await updateBrandMutation.mutateAsync(apiData);
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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 animate-pulse rounded w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 animate-pulse rounded w-1/4" />
              <div className="h-10 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 animate-pulse rounded w-1/4" />
              <div className="h-20 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 animate-pulse rounded w-1/4" />
              <div className="h-10 bg-gray-200 animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!brand) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <p className="text-sm text-destructive">{errors.name.message}</p>
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

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
              disabled={updateBrandMutation.isPending}
            />
            <Label htmlFor="isActive">Active Brand</Label>
          </div>
          {errors.isActive && (
            <p className="text-sm text-destructive">
              {errors.isActive.message}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/inventory/brands")}
          disabled={updateBrandMutation.isPending}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={updateBrandMutation.isPending}>
          {updateBrandMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {updateBrandMutation.isPending ? "Updating..." : "Update Brand"}
        </Button>
      </div>
    </form>
  );
}
