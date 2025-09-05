'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

// Hooks
import { useDebounce } from '@/hooks/useDebounce';
import {
  useCategories,
  useDeleteCategory,
  type Category as APICategory,
} from '@/hooks/api/categories';

// Permissions
import { usePermissions } from '@/hooks/usePermissions';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Mobile-optimized components
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { MobileDashboardFiltersBar, FilterConfig } from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

// Custom Components
import CategoryDetailPopup from '@/components/inventory/CategoryDetailPopup';
import { CATEGORY_COLUMNS } from '@/components/inventory/CategoryColumnCustomizer';

// Icons
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconTag,
  IconAlertTriangle,
  IconFolder,
  IconEye,
} from '@tabler/icons-react';

// Utils and Types
import { formatDate } from '@/lib/utils';
import { ErrorHandlers } from '@/lib/utils/error-handling';
import { SortOption, PaginationState } from '@/types/inventory';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface MobileCategoryListProps {
  user: User;
}

interface CategoryFilters {
  search: string;
  isActive: string;
  parentId: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
];

const MobileCategoryList = ({ user }: MobileCategoryListProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<APICategory | null>(null);
  const [detailPopupOpen, setDetailPopupOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['name', 'isActive', 'products', 'createdAt']);

  // Get permissions using centralized hook
  const permissions = usePermissions();
  const { canManageCategories, canDeleteCategories } = permissions;

  const [filters, setFilters] = useState<CategoryFilters>({
    search: '',
    isActive: '',
    parentId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 300);
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks
  const categoriesQuery = useCategories({
    search: debouncedSearchTerm,
    status: filters.isActive,
    parentId:
      filters.parentId === 'all' || filters.parentId === ''
        ? undefined
        : filters.parentId === 'null'
          ? null
          : filters.parentId === 'subcategories'
            ? 'subcategories'
            : parseInt(filters.parentId),
    includeChildren: true,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page: pagination.page,
    limit: pagination.limit,
  });

  const deleteCategoryMutation = useDeleteCategory();

  // Extract data from queries
  const categories = useMemo(
    () => categoriesQuery.data?.data || [],
    [categoriesQuery.data?.data]
  );

  // Filter available columns based on permissions
  const availableColumns = useMemo(() => {
    return CATEGORY_COLUMNS.filter(column => {
      return true; // No special permission filtering needed for categories
    });
  }, []);

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'isActive',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
        placeholder: 'All Status',
      },
      {
        key: 'parentId',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'null', label: 'Main Categories' },
          { value: 'subcategories', label: 'Subcategories' },
        ],
        placeholder: 'All Types',
      },
    ],
    []
  );

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => {
      const filterKey = key as keyof CategoryFilters;
      if (prev[filterKey] === value) return prev;
      return { ...prev, [filterKey]: value };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      isActive: '',
      parentId: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newPageSize,
      page: 1,
    }));
  };

  // Delete category handler
  const handleDeleteCategory = useCallback(
    async (category: APICategory) => {
      try {
        await deleteCategoryMutation.mutateAsync(category.id);
        toast.success(`Category "${category.name}" deleted successfully`);
        categoriesQuery.refetch();
      } catch (error) {
        ErrorHandlers.api(error, 'Failed to delete category');
      }
    },
    [deleteCategoryMutation, categoriesQuery]
  );

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-500">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getHierarchyDisplay = (category: APICategory) => {
    if (category.parent) {
      return `${category.parent.name} → ${category.name}`;
    }
    return category.name;
  };

  const renderCell = (category: APICategory, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="min-w-0">
            <div className="font-medium truncate">{getHierarchyDisplay(category)}</div>
            {category.description && (
              <div className="text-xs sm:text-sm text-muted-foreground truncate">
                {category.description.length > 20 ? `${category.description.substring(0, 20)}...` : category.description}
              </div>
            )}
          </div>
        );
      case 'description':
        return <span className="text-xs sm:text-sm">{category.description ? (category.description.length > 20 ? `${category.description.substring(0, 20)}...` : category.description) : '-'}</span>;
      case 'parent':
        return <span className="text-xs sm:text-sm">{category.parent?.name || 'Main Category'}</span>;
      case 'products':
        return <span className="text-xs sm:text-sm font-medium">{category.productCount || 0}</span>;
      case 'subcategories':
        return <span className="text-xs sm:text-sm font-medium">{category.children?.length || 0}</span>;
      case 'isActive':
        return getStatusBadge(category.isActive);
      case 'wordpress_id':
        return <span className="text-xs sm:text-sm font-mono">{category.wordpress_id || '-'}</span>;
      case 'createdAt':
        return <span className="text-xs sm:text-sm">{formatDate(category.createdAt)}</span>;
      case 'updatedAt':
        return <span className="text-xs sm:text-sm">{formatDate(category.updatedAt)}</span>;
      default:
        return <span className="text-xs sm:text-sm">-</span>;
    }
  };

  const renderActions = (category: APICategory) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <IconDots className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            setSelectedCategoryId(category.id);
            setDetailPopupOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <IconEye className="h-4 w-4" />
          View Details
        </DropdownMenuItem>
        {canManageCategories && (
          <DropdownMenuItem asChild>
            <Link
              href={`/inventory/categories/${category.id}/edit`}
              className="flex items-center gap-2"
            >
              <IconEdit className="h-4 w-4" />
              Edit Category
            </Link>
          </DropdownMenuItem>
        )}
        {canDeleteCategories && (
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => {
              setCategoryToDelete(category);
              setDeleteDialogOpen(true);
            }}
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Mobile card title and subtitle
  const mobileCardTitle = (category: APICategory) => (
    <div className="flex items-center gap-3">
      {/* Category Icon */}
      <div className="flex-shrink-0">
        <div className="h-10 w-10 bg-blue-100 rounded-md flex items-center justify-center">
          <IconFolder className="h-5 w-5 text-blue-600" />
        </div>
      </div>
      {/* Category Name */}
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">
        {getHierarchyDisplay(category)}
      </span>
    </div>
  );

  const mobileCardSubtitle = (category: APICategory) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{category.productCount || 0} products</span>
      {category.children && category.children.length > 0 && (
        <>
          <span>•</span>
          <span>{category.children.length} subcategories</span>
        </>
      )}
    </div>
  );

  // Update pagination state when API response changes
  React.useEffect(() => {
    if (categoriesQuery.data?.pagination) {
      const apiPagination = categoriesQuery.data.pagination;
      setPagination(prev => ({
        ...prev,
        totalPages: apiPagination.totalPages || Math.ceil((apiPagination.totalCategories || 0) / prev.limit),
        totalItems: apiPagination.totalCategories || 0,
      }));
    }
  }, [categoriesQuery.data?.pagination]);

  return (
    <>
      <DashboardPageLayout
        title="Categories"
        description="Manage product categories and organize your inventory"
        actions={
          canManageCategories ? (
            <div className="flex flex-row items-center gap-2">
              <Button asChild>
                <Link
                  href="/inventory/categories/add"
                  className="flex items-center gap-2"
                >
                  <IconPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Category</span>
                  <span className="sm:hidden">Add</span>
                </Link>
              </Button>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-6">
          {/* Mobile-optimized Filters */}
          <MobileDashboardFiltersBar
            searchPlaceholder="Search categories..."
            searchValue={filters.search}
            onSearchChange={value => handleFilterChange('search', value)}
            isSearching={isSearching}
            filters={filterConfigs}
            filterValues={filters as unknown as Record<string, unknown>}
            onFilterChange={(key: string, value: unknown) =>
              handleFilterChange(key, value as string | boolean)
            }
            onResetFilters={handleResetFilters}
            sortOptions={SORT_OPTIONS}
            currentSort={`${filters.sortBy}-${filters.sortOrder}`}
            onSortChange={handleSortChange}
          />

          {/* Mobile-optimized Table */}
          <MobileDashboardTable
            tableTitle="Categories"
            totalCount={pagination.totalItems}
            currentCount={categories.length}
            columns={availableColumns}
            visibleColumns={visibleColumns}
            onColumnsChange={setVisibleColumns}
            columnCustomizerKey="categories-visible-columns"
            data={categories}
            renderCell={renderCell}
            renderActions={renderActions}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={categoriesQuery.isLoading}
            isRefetching={categoriesQuery.isFetching && !categoriesQuery.isLoading}
            error={categoriesQuery.error?.message}
            onRetry={() => categoriesQuery.refetch()}
            emptyStateIcon={
              <IconFolder className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            }
            emptyStateMessage="No categories found"
            emptyStateAction={
              canManageCategories ? (
                <Button asChild>
                  <Link href="/inventory/categories/add">Create Your First Category</Link>
                </Button>
              ) : undefined
            }
            mobileCardTitle={mobileCardTitle}
            mobileCardSubtitle={mobileCardSubtitle}
            keyExtractor={category => category.id}
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{categoryToDelete?.name}"?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setCategoryToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (categoryToDelete) {
                    handleDeleteCategory(categoryToDelete);
                  }
                  setDeleteDialogOpen(false);
                  setCategoryToDelete(null);
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Detail Popup */}
        {detailPopupOpen && selectedCategoryId && (
          <CategoryDetailPopup
            key={selectedCategoryId}
            open={detailPopupOpen}
            onOpenChange={(open) => {
              setDetailPopupOpen(open);
              if (!open) {
                setSelectedCategoryId(null);
                // Force cleanup of any lingering modal state
                setTimeout(() => {
                  document.body.style.pointerEvents = 'auto';
                  document.body.style.overflow = 'auto';
                }, 100);
              }
            }}
            categoryId={selectedCategoryId}
            user={user}
          />
        )}
      </DashboardPageLayout>
    </>
  );
};

export default React.memo(MobileCategoryList);