"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { FormLoading } from "@/components/ui/form-loading";
import { createCategorySchema } from "@/lib/validations/category";
import { toast } from "sonner";
import { useCreateCategory } from "@/hooks/api/categories";

type CreateCategoryFormData = {
  name: string;
  description: string;
  isActive: boolean;
};

export default function AddCategoryForm() {
  const router = useRouter();
  const createCategoryMutation = useCreateCategory();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [formData, setFormData] = useState<CreateCategoryFormData>({
    name: "",
    description: "",
    isActive: true,
  });

  const validateForm = (data: CreateCategoryFormData) => {
    try {
      createCategorySchema.parse(data);
      setValidationErrors({});
      return true;
    } catch (error: unknown) {
      const errors: Record<string, string> = {};
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ path: string[], message: string }> };
        zodError.errors.forEach((err) => {
          if (err.path && err.path.length > 0) {
            errors[err.path[0]] = err.message;
          }
        });
      }
      setValidationErrors(errors);
      return false;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(formData)) {
      return;
    }

    setSubmitError(null);

    // Transform form data to match Category interface
    const categoryData = {
      name: formData.name,
      description: formData.description || undefined,
      isActive: formData.isActive,
    };

    createCategoryMutation.mutate(categoryData, {
      onSuccess: () => {
        toast.success("Category created successfully!");
        router.push("/inventory/categories");
        router.refresh();
      },
      onError: (error) => {
        console.error("Error creating category:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create category";
        setSubmitError(errorMessage);
        toast.error(errorMessage);
      },
    });
  };

  const handleCancel = () => {
    router.push("/inventory/categories");
  };

  const updateFormData = (field: keyof CreateCategoryFormData, value: string | boolean) => {
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
        onBack={handleCancel}
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
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                Category Name
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Electronics, Clothing, Books"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                className={validationErrors.name ? "border-red-500" : ""}
                disabled={createCategoryMutation.isPending}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500">{validationErrors.name}</p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter a unique name for this category. This will be used to
                organize products.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this category (optional)"
                className="min-h-[80px]"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                disabled={createCategoryMutation.isPending}
              />
              {validationErrors.description && (
                <p className="text-sm text-red-500">
                  {validationErrors.description}
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Optional description to help identify the purpose of this
                category.
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-base">
                  Active Status
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active categories will be available for product assignment.
                  Inactive categories will be hidden from selection.
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

            {/* Form Actions */}
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
