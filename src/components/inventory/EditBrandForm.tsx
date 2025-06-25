"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateBrandSchema,
  type UpdateBrandData,
} from "@/lib/validations/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateBrandData>({
    resolver: zodResolver(updateBrandSchema),
  });

  const isActive = watch("isActive");

  // Fetch brand data
  useEffect(() => {
    const fetchBrand = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/brands/${brandId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch brand");
        }

        const data = await response.json();

        if (data.success && data.brand) {
          setBrand(data.brand);
          // Set form values
          reset({
            id: data.brand.id,
            name: data.brand.name,
            description: data.brand.description,
            website: data.brand.website,
            isActive: data.brand.is_active,
          });
        } else {
          throw new Error("Brand not found");
        }
      } catch (error) {
        console.error("Error fetching brand:", error);
        toast.error("Failed to load brand data");
        router.push("/inventory/brands");
      } finally {
        setIsLoading(false);
      }
    };

    if (brandId) {
      fetchBrand();
    }
  }, [brandId, reset, router]);

  const onSubmit = async (data: UpdateBrandData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      // Clean up website URL
      if (data.website && data.website.trim() === "") {
        data.website = null;
      }

      const response = await fetch(`/api/brands/${brandId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update brand");
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Brand updated successfully!");
        router.push("/inventory/brands");
      } else {
        throw new Error("Failed to update brand");
      }
    } catch (error) {
      console.error("Error updating brand:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update brand";
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              Brand Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter brand name"
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSubmitting ? "Updating..." : "Update Brand"}
        </Button>
      </div>
    </form>
  );
}
