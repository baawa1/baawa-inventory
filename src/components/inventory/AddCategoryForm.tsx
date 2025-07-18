"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Hooks
import {
  useCreateCategory,
  useTopLevelCategories,
} from "@/hooks/api/categories";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";

// Icons
import { IconArrowLeft, IconFolder } from "@tabler/icons-react";

interface CreateCategoryFormData {
  name: string;
  description: string;
  image: string | null;
  isActive: boolean;
  parentId: number | null;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive?: string;
}

export default function AddCategoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentIdFromUrl = searchParams.get("parentId");

  const [formData, setFormData] = useState<CreateCategoryFormData>({
    name: "",
    description: "",
    image: null,
    isActive: true,
    parentId: parentIdFromUrl ? parseInt(parentIdFromUrl) : null,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [error, setError] = useState<string | null>(null);

  const createCategoryMutation = useCreateCategory();
  const { data: parentCategoriesData } = useTopLevelCategories();

  // Validation function
  const validateForm = (data: CreateCategoryFormData): boolean => {
    const errors: ValidationErrors = {};

    if (!data.name.trim()) {
      errors.name = "Category name is required";
    } else if (data.name.length > 100) {
      errors.name = "Category name must be 100 characters or less";
    }

    if (!data.image) {
      errors.image = "Category image is required";
    }

    if (data.description && data.description.length > 500) {
      errors.description = "Description must be 500 characters or less";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(formData)) {
      return;
    }

    setError(null);

    createCategoryMutation.mutate(
      {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        image: formData.image!,
        isActive: formData.isActive,
        parentId: formData.parentId || undefined,
      },
      {
        onSuccess: (createdCategory) => {
          console.log("Category created successfully:", createdCategory);
          toast.success("Category created successfully!");
          router.push("/inventory/categories");
        },
        onError: (error) => {
          console.error("Error creating category:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to create category";
          setError(errorMessage);
          toast.error(errorMessage);
        },
      }
    );
  };

  const handleCancel = () => {
    router.push("/inventory/categories");
  };

  const updateFormData = (field: keyof CreateCategoryFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Show loading state
  if (createCategoryMutation.isPending) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Creating category...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4 flex items-center gap-2"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to Categories
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Add Category</h1>
        <p className="text-muted-foreground">
          Create a new product category to organize your inventory
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Category Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter category name"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              className={validationErrors.name ? "border-destructive" : ""}
            />
            {validationErrors.name && (
              <p className="text-sm text-destructive">
                {validationErrors.name}
              </p>
            )}
          </div>

          {/* Parent Category */}
          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Category</Label>
            <Select
              value={formData.parentId?.toString() || ""}
              onValueChange={(value) =>
                updateFormData("parentId", value ? parseInt(value) : null)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <div className="flex items-center space-x-2">
                    <IconFolder className="h-4 w-4" />
                    <span>No parent (Top-level category)</span>
                  </div>
                </SelectItem>
                {parentCategoriesData?.data?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <IconFolder className="h-4 w-4" />
                      <span>{category.name}</span>
                      {category.subcategoryCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({category.subcategoryCount} subcategories)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.parentId && (
              <p className="text-sm text-destructive">
                {validationErrors.parentId}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Leave empty to create a top-level category, or select a parent to
              create a subcategory
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter category description (optional)"
            value={formData.description}
            onChange={(e) => updateFormData("description", e.target.value)}
            rows={3}
            className={validationErrors.description ? "border-destructive" : ""}
          />
          {validationErrors.description && (
            <p className="text-sm text-destructive">
              {validationErrors.description}
            </p>
          )}
        </div>

        {/* Category Image */}
        <div className="space-y-2">
          <Label htmlFor="image">
            Category Image <span className="text-destructive">*</span>
          </Label>
          <ImageUpload
            value={formData.image}
            onChange={(url) => updateFormData("image", url)}
            onError={(error) => {
              console.error("Image upload error:", error);
            }}
            placeholder="Upload a category image (required)"
            disabled={createCategoryMutation.isPending}
            folder="categories"
            alt="Category image"
          />
          {validationErrors.image && (
            <p className="text-sm text-destructive">{validationErrors.image}</p>
          )}
          <p className="text-xs text-muted-foreground">
            A category image is required to help identify and organize products.
          </p>
        </div>

        {/* Active Status */}
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => updateFormData("isActive", checked)}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 border border-destructive bg-destructive/10 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center gap-4 pt-6">
          <Button type="submit" disabled={createCategoryMutation.isPending}>
            {createCategoryMutation.isPending
              ? "Creating..."
              : "Create Category"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={createCategoryMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
