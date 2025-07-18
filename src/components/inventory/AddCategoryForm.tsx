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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";
import { PageHeader } from "@/components/ui/page-header";
import { FormLoading } from "@/components/ui/form-loading";

// Icons
import { ArrowLeft, Loader2 } from "lucide-react";
import { IconFolder } from "@tabler/icons-react";

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
      <FormLoading
        title="Add Category"
        description="Create a new product category to organize your inventory"
        backLabel="Back to Categories"
        onBack={() => router.push("/inventory/categories")}
        backUrl="/inventory/categories"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>
        <PageHeader
          title="Add Category"
          description="Create a new product category to organize your inventory"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Information</CardTitle>
          <CardDescription>
            Enter the details for the new category. Required fields are marked
            with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={onSubmit} className="space-y-6">
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
                disabled={createCategoryMutation.isPending}
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Category</Label>
              <Select
                value={formData.parentId?.toString() || "none"}
                onValueChange={(value) =>
                  updateFormData(
                    "parentId",
                    value === "none" ? null : parseInt(value)
                  )
                }
                disabled={createCategoryMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center space-x-2">
                      <IconFolder className="h-4 w-4" />
                      <span>No parent (Top-level category)</span>
                    </div>
                  </SelectItem>
                  {parentCategoriesData?.data?.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
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
                Leave empty to create a top-level category, or select a parent
                to create a subcategory
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter category description (optional)"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                rows={3}
                className={
                  validationErrors.description ? "border-destructive" : ""
                }
                disabled={createCategoryMutation.isPending}
              />
              {validationErrors.description && (
                <p className="text-sm text-destructive">
                  {validationErrors.description}
                </p>
              )}
            </div>

            <ImageUpload
              value={formData.image}
              onChange={(url) => updateFormData("image", url)}
              onError={(error) => {
                console.error("Image upload error:", error);
              }}
              label="Category Image"
              placeholder="Upload a category image"
              disabled={createCategoryMutation.isPending}
              folder="categories"
              alt="Category image"
            />
            {validationErrors.image && (
              <p className="text-sm text-destructive">
                {validationErrors.image}
              </p>
            )}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-base">
                  Active Status
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active categories will be available for product assignment.
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  updateFormData("isActive", checked)
                }
                disabled={createCategoryMutation.isPending}
              />
            </div>
            {validationErrors.isActive && (
              <p className="text-sm text-destructive">
                {validationErrors.isActive}
              </p>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 border border-destructive bg-destructive/10 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              <Button
                type="submit"
                disabled={createCategoryMutation.isPending}
                className="flex items-center gap-2"
              >
                {createCategoryMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
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
        </CardContent>
      </Card>
    </div>
  );
}
