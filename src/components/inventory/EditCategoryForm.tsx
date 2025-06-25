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
import { updateCategorySchema } from "@/lib/validations/category";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditCategoryFormProps {
  category: Category;
}

type UpdateCategoryFormData = {
  name: string;
  description: string;
  isActive: boolean;
};

export default function EditCategoryForm({ category }: EditCategoryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [formData, setFormData] = useState<UpdateCategoryFormData>({
    name: category.name,
    description: category.description || "",
    isActive: category.isActive,
  });

  const validateForm = (data: UpdateCategoryFormData) => {
    try {
      updateCategorySchema.parse({ ...data, id: category.id });
      setValidationErrors({});
      return true;
    } catch (error: any) {
      const errors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          if (err.path && err.path[0] !== "id") {
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

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update category");
      }

      const result = await response.json();

      toast.success("Category updated successfully!");
      router.push("/inventory/categories");
      router.refresh();
    } catch (error) {
      console.error("Error updating category:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update category";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/inventory/categories");
  };

  const updateFormData = (field: keyof UpdateCategoryFormData, value: any) => {
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

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header Section */}
          <div className="px-4 lg:px-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Categories
              </Button>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Edit Category
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Update the details for "{category.name}" category
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-4 lg:px-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Category Information</CardTitle>
                <CardDescription>
                  Update the details for this category. Required fields are
                  marked with an asterisk (*).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
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
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-500">
                        {validationErrors.name}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enter a unique name for this category. This will be used
                      to organize products.
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
                      onChange={(e) =>
                        updateFormData("description", e.target.value)
                      }
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
                        Active categories will be available for product
                        assignment. Inactive categories will be hidden from
                        selection.
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        updateFormData("isActive", checked)
                      }
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      {isSubmitting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {isSubmitting ? "Updating..." : "Update Category"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
