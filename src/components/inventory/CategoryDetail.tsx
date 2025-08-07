'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Hooks
import { useCategory } from '@/hooks/api/categories';
import { Category } from '@/hooks/api/categories';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ImagePreview } from '@/components/ui/image-preview';

// Icons
import {
  IconArrowLeft,
  IconEdit,
  IconPlus,
  IconTag,
  IconFolder,
  IconPackage,
  IconCalendar,
  IconClock,
  IconEye,
  IconTrash,
} from '@tabler/icons-react';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface CategoryDetailProps {
  categoryId: number;
  user: User;
}

export default function CategoryDetail({
  categoryId,
  user,
}: CategoryDetailProps) {
  const router = useRouter();
  const { data: categoryData, isLoading, error } = useCategory(categoryId);

  // Permission checks
  const canManageCategories = ['ADMIN', 'MANAGER'].includes(user.role);
  const canDeleteCategories = user.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground">Loading category details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !categoryData) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="text-center">
          <IconTag className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h2 className="mb-2 text-xl font-semibold">Category Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The category you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Button onClick={() => router.push('/inventory/categories')}>
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  const category = categoryData;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/inventory/categories')}
            className="flex items-center gap-2"
          >
            <IconArrowLeft className="h-4 w-4" />
            Back to Categories
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {category.name}
            </h1>
            <p className="text-muted-foreground">
              Category Details and Information
            </p>
          </div>
        </div>

        {canManageCategories && (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/inventory/categories/${category.id}/edit`}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit Category
              </Link>
            </Button>
            {!category.parentId && (
              <Button asChild>
                <Link
                  href={`/inventory/categories/add?parentId=${category.id}`}
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Subcategory
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                  {category.image ? (
                    <ImagePreview
                      src={category.image}
                      alt={category.name}
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
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant={category.isActive ? 'default' : 'secondary'}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {category.parent && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <IconFolder className="h-3 w-3" />
                          Subcategory of {category.parent.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {category.description && (
                    <div>
                      <h4 className="text-muted-foreground mb-1 text-sm font-medium">
                        Description
                      </h4>
                      <p className="text-sm">{category.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Products:</span>
                      <div className="mt-1 flex items-center gap-1">
                        <IconPackage className="h-4 w-4" />
                        <span className="font-medium">
                          {category.productCount}
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
                          {category.subcategoryCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subcategories */}
          {category.children && category.children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconFolder className="h-5 w-5" />
                  Subcategories ({category.children.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {category.children.map((child: Category) => (
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
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/inventory/categories/${child.id}`}>
                          <IconEye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconClock className="h-5 w-5" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <IconCalendar className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(category.createdAt).toLocaleDateString()} at{' '}
                      {new Date(category.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IconClock className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-muted-foreground text-sm">
                      {new Date(category.updatedAt).toLocaleDateString()} at{' '}
                      {new Date(category.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {canManageCategories && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href={`/inventory/categories/${category.id}/edit`}>
                    <IconEdit className="mr-2 h-4 w-4" />
                    Edit Category
                  </Link>
                </Button>
                {!category.parentId && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link
                      href={`/inventory/categories/add?parentId=${category.id}`}
                    >
                      <IconPlus className="mr-2 h-4 w-4" />
                      Add Subcategory
                    </Link>
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Link href="/inventory/products/add">
                    <IconPackage className="mr-2 h-4 w-4" />
                    Add Product
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

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
                <Badge variant="outline">{category.productCount}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Subcategories
                </span>
                <Badge variant="outline">{category.subcategoryCount}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Status</span>
                <Badge variant={category.isActive ? 'default' : 'secondary'}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          {canDeleteCategories && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm">
                    Once you delete a category, there is no going back. Please
                    be certain.
                  </p>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => {
                      toast.error(
                        'Delete functionality not implemented in view mode'
                      );
                    }}
                  >
                    <IconTrash className="mr-2 h-4 w-4" />
                    Delete Category
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
