'use client';

import React from 'react';
import Link from 'next/link';

// Hooks
import { useCategory } from '@/hooks/api/categories';
import { Category } from '@/hooks/api/categories';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ImagePreview } from '@/components/ui/image-preview';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Icons
import {
  IconEdit,
  IconTag,
  IconFolder,
  IconPackage,
  IconEye,
} from '@tabler/icons-react';

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
  onOpenChange: (open: boolean) => void;
  onCategoryChange?: (categoryId: number) => void;
}

export default function CategoryDetailPopup({
  categoryId,
  user,
  open,
  onOpenChange,
  onCategoryChange,
}: CategoryDetailPopupProps) {
  const { data: categoryData, isLoading, error } = useCategory(categoryId || 0);

  // Permission checks
  const canManageCategories = ['ADMIN', 'MANAGER'].includes(user.role);

  if (!categoryId) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconTag className="h-5 w-5" />
              Category Details
            </DialogTitle>
          </DialogHeader>

          {isLoading && (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
                <p className="text-muted-foreground">
                  Loading category details...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center">
              <IconTag className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h2 className="mb-2 text-xl font-semibold">Category Not Found</h2>
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
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {/* Main Category Information */}
                <div className="space-y-6 lg:col-span-2">
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
                            <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-100">
                              <IconTag className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {categoryData.name}
                            </h3>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge
                                variant={
                                  categoryData.isActive
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {categoryData.isActive ? 'Active' : 'Inactive'}
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
                              <h4 className="text-muted-foreground mb-1 text-sm font-medium">
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
                              <div className="mt-1 flex items-center gap-1">
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
                              <div className="mt-1 flex items-center gap-1">
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
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {categoryData.children.map((child: Category) => (
                              <div
                                key={child.id}
                                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-3">
                                  <IconFolder className="text-muted-foreground h-4 w-4" />
                                  <div>
                                    <p className="font-medium">{child.name}</p>
                                    <p className="text-muted-foreground text-sm">
                                      {child.productCount || 0} products
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
                        <span className="text-muted-foreground text-sm">
                          Total Products
                        </span>
                        <Badge variant="outline">
                          {categoryData.productCount}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Subcategories
                        </span>
                        <Badge variant="outline">
                          {categoryData.subcategoryCount}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Status
                        </span>
                        <Badge
                          variant={
                            categoryData.isActive ? 'default' : 'secondary'
                          }
                        >
                          {categoryData.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
