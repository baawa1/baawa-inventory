"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createBrandFormSchema,
  type CreateBrandFormData,
} from "@/lib/validations/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useCreateBrand } from "@/hooks/api/brands";

export default function AddBrandForm() {
  const router = useRouter();
  const createBrandMutation = useCreateBrand();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBrandFormData>({
    resolver: zodResolver(createBrandFormSchema),
    defaultValues: {
      name: "",
      description: null,
      website: null,
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  const onSubmit = async (data: CreateBrandFormData) => {
    // Clean up website URL and description to match Brand interface types
    const brandData = {
      name: data.name,
      description: data.description || undefined,
      website: data.website || undefined,
      isActive: data.isActive,
    };

    createBrandMutation.mutate(brandData, {
      onSuccess: () => {
        toast.success("Brand created successfully!");
        router.push("/inventory/brands");
      },
      onError: (error) => {
        console.error("Error creating brand:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create brand";
        toast.error(errorMessage);
      },
    });
  };

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
              disabled={createBrandMutation.isPending}
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
              disabled={createBrandMutation.isPending}
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
              disabled={createBrandMutation.isPending}
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
              disabled={createBrandMutation.isPending}
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
          disabled={createBrandMutation.isPending}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={createBrandMutation.isPending}>
          {createBrandMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {createBrandMutation.isPending ? "Creating..." : "Create Brand"}
        </Button>
      </div>
    </form>
  );
}
