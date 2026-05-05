'use client';

import React from 'react';
import Link from 'next/link';

// Hooks
import { useCategory } from '@/hooks/api/categories';
import { Category } from '@/hooks/api/categories';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InlineLoading } from '@/components/ui/loading';
import {
  detailDialogContentClassName,
  DetailItem,
  DetailMetric,
  DetailSection,
} from '@/components/ui/detail-dialog';

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
  onOpenChange: (_open: boolean) => void;
  onCategoryChange?: (_categoryId: number) => void;
}

export default function CategoryDetailPopup({
  categoryId: _categoryId,
  user,
  open: _open,
  onOpenChange,
  onCategoryChange,
}: CategoryDetailPopupProps) {
  const {
    data: categoryData,
    isLoading,
    error,
  } = useCategory(_categoryId || 0);

  // Permission checks
  const canManageCategories = ['ADMIN', 'MANAGER'].includes(user.role);

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    // Force focus back to document body when closing
    if (!open) {
      setTimeout(() => {
        document.body.focus();
      }, 0);
    }
  };

  return (
    <>
      <Dialog open={_open} onOpenChange={handleClose}>
        <DialogContent className={detailDialogContentClassName}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconTag className="h-5 w-5" />
              Category Details
            </DialogTitle>
          </DialogHeader>

          {isLoading && (
            <div className="flex h-64 items-center justify-center">
              <InlineLoading label="Loading category details..." />
            </div>
          )}

          {error && (
            <div className="text-center">
              <IconTag className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h2 className="mb-2 text-xl font-semibold">Category Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The category you&apos;re looking for doesn&apos;t exist or has
                been deleted.
              </p>
            </div>
          )}

          {categoryData && (
            <div className="grid gap-4 text-sm">
              {/* Header with Actions */}
              <DetailSection title="Category Summary">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
              </DetailSection>

              <DetailSection title="Key Metrics">
                <div className="grid gap-3 md:grid-cols-3">
                  <DetailMetric
                    label="Products"
                    value={categoryData.productCount}
                  />
                  <DetailMetric
                    label="Subcategories"
                    value={categoryData.subcategoryCount}
                  />
                  <DetailMetric
                    label="Status"
                    value={categoryData.isActive ? 'Active' : 'Inactive'}
                  />
                </div>
              </DetailSection>

              <DetailSection title="Category Information">
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <IconTag className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={categoryData.isActive ? 'default' : 'secondary'}
                      >
                        {categoryData.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {categoryData.parent ? (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <IconFolder className="h-3 w-3" />
                          Subcategory of {categoryData.parent.name}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <DetailItem label="Name" value={categoryData.name} />
                      <DetailItem
                        label="Parent Category"
                        value={categoryData.parent?.name || 'None'}
                      />
                      <div className="md:col-span-2">
                        <DetailItem
                          label="Description"
                          value={categoryData.description || 'No description provided.'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </DetailSection>

              {categoryData.children && categoryData.children.length > 0 ? (
                <DetailSection
                  title={`Subcategories (${categoryData.children.length})`}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
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
                </DetailSection>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
