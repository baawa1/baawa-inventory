"use client";

import React from "react";
import Link from "next/link";
import { toast } from "sonner";

// Hooks
import { useCategory, useDeleteCategory } from "@/hooks/api/categories";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImagePreview } from "@/components/ui/image-preview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Icons
import {
  IconEdit,
  IconTag,
  IconFolder,
  IconPackage,
  IconEye,
  IconTrash,
  IconAlertTriangle,
} from "@tabler/icons-react";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface CategoryDetailPopupProps {
  categoryId: number | null;
  user: User;
  open: boolean;
}

export default function CategoryDetailPopup({
  categoryId,
  user,
  open,
  onOpenChange,
  onCategoryChange,
}: CategoryDetailPopupProps) {
  const { data: categoryData, isLoading, error } = useCategory(categoryId || 0);
  const deleteCategoryMutation = useDeleteCategory();

  // Permission checks
  const canManageCategories = ["ADMIN", "MANAGER"].includes(user.role);
  const canDeleteCategories = user.role === "ADMIN";

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!categoryData) return;

    try {
      await deleteCategoryMutation.mutateAsync(categoryData.id);
      toast.success("Category deleted successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category"
      );
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (!categoryId) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconTag className="h-5 w-5" />
              Category Details
            </DialogTitle>
          </DialogHeader>

          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  Loading category details...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center">
              <IconTag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Category Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The category you're looking for doesn't exist or has been
                deleted.
              </p>
            </div>
          )}

          {categoryData && (
            <div className="space-y-6">
              {/* Header with Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {categoryData.name}
                  </h1>
                  <p className="text-muted-foreground">
                    Category Details and Information
                  </p>
                </div>

                {canManageCategories && (
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                      <Link
                        href={`/inventory/categories/${categoryData.id}/edit`}
                      >
                        <IconEdit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                    {canDeleteCategories && categoryData.productCount === 0 && (
                      <Button
                        variant="destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {/* Main Category Information */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Category Image and Basic Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconTag className="h-5 w-5" />
                        Category Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Image */}
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0">
                          {categoryData.image ? (
                            <ImagePreview
                              src={categoryData.image}
                              alt={categoryData.name}
                              size="xl"
                              className="rounded-lg border"
                            />
                          ) : (
                            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                              <IconTag className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {categoryData.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  categoryData.isActive
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {categoryData.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {categoryData.parent && (
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <IconFolder className="h-3 w-3" />
                                  Subcategory of {categoryData.parent.name}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {categoryData.description && (
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                                Description
                              </h4>
                              <p className="text-sm">
                                {categoryData.description}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Products:
                              </span>
                              <div className="flex items-center gap-1 mt-1">
                                <IconPackage className="h-4 w-4" />
                                <span className="font-medium">
                                  {categoryData.productCount}
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Subcategories:
                              </span>
                              <div className="flex items-center gap-1 mt-1">
                                <IconFolder className="h-4 w-4" />
                                <span className="font-medium">
                                  {categoryData.subcategoryCount}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subcategories */}
                  {categoryData.children &&
                    categoryData.children.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <IconFolder className="h-5 w-5" />
                            Subcategories ({categoryData.children.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categoryData.children.map((child: any) => (
                              <div
                                key={child.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <IconFolder className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{child.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {child._count?.products || 0} products
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (onCategoryChange) {
                                      onCategoryChange(child.id);
                                    }
                                  }}
                                >
                                  <IconEye className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Category Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total Products
                        </span>
                        <Badge variant="outline">
                          {categoryData.productCount}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Subcategories
                        </span>
                        <Badge variant="outline">
                          {categoryData.subcategoryCount}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Status
                        </span>
                        <Badge
                          variant={
                            categoryData.isActive ? "default" : "secondary"
                          }
                        >
                          {categoryData.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Danger Zone */}
                  {canDeleteCategories && categoryData.productCount === 0 && (
                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="text-red-600">
                          Danger Zone
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Once you delete a category, there is no going back.
                            Please be certain.
                          </p>
                          <Button
                            variant="destructive"
                            className="w-full justify-start"
                            onClick={() => setDeleteDialogOpen(true)}
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete Category
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Cannot Delete Warning */}
                  {canDeleteCategories && categoryData.productCount > 0 && (
                    <Card className="border-orange-200">
                      <CardHeader>
                        <CardTitle className="text-orange-600">
                          Cannot Delete
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            This category cannot be deleted because it has{" "}
                            {categoryData.productCount} associated products.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Remove all products from this category before
                            deleting it.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-red-500" />
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{categoryData?.name}
              "? This action cannot be undone.
              {categoryData && categoryData.subcategoryCount > 0 && (
                <div className="mt-2 text-destructive">
                  This category has {categoryData.subcategoryCount}{" "}
                  subcategories.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
