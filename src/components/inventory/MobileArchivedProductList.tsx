'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useArchivedProducts,
  useUnarchiveProduct,
  type Product as APIProduct,
} from '@/hooks/api/products';

// Mobile-optimized components
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { MobileDashboardFiltersBar, FilterConfig } from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Icons
import {
  IconDots,
  IconEye,
  IconArchiveOff,
  IconArchive,
  IconAlertTriangle,
  IconPackages,
  IconCalendar,
} from '@tabler/icons-react';

// Utils
import { formatCurrency } from '@/lib/utils';
import { formatCategoryHierarchy } from '@/lib/utils/category';
import { ProductImage } from '@/components/ui/product-image';

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface MobileArchivedProductListProps {
  user: User;
}

export function MobileArchivedProductList({ user }: MobileArchivedProductListProps) {
  const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false);
  const [productToUnarchive, setProductToUnarchive] = useState<APIProduct | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Clean up any "actions" column from localStorage and state
  React.useEffect(() => {
    if (visibleColumns.includes('actions')) {
      setVisibleColumns(prev => prev.filter(col => col !== 'actions'));
    }

    const storageKey = 'archived-products-visible-columns';
    const storedColumns = localStorage.getItem(storageKey);
    if (storedColumns) {
      try {
        const parsed = JSON.parse(storedColumns);
        if (Array.isArray(parsed) && parsed.includes('actions')) {
          const cleaned = parsed.filter((col: string) => col !== 'actions');
          localStorage.setItem(storageKey, JSON.stringify(cleaned));
        }
      } catch (_error) {
        localStorage.removeItem(storageKey);
      }
    }
  }, [visibleColumns]);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    brandId: '',
  });

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 500);
  const isSearching = filters.search !== debouncedSearchTerm;

  // API hooks
  const archivedProductsQuery = useArchivedProducts(
    {
      search: debouncedSearchTerm,
      categoryId: filters.categoryId,
      brandId: filters.brandId,
    },
    {
      page: pagination.page,
      limit: pagination.limit,
    }
  );

  const unarchiveProductMutation = useUnarchiveProduct();

  // Extract data
  const products = useMemo(
    () => archivedProductsQuery.data?.data || [],
    [archivedProductsQuery.data?.data]
  );

  // Column configuration with bold headers
  const columns = useMemo(
    () => [
      {
        key: 'image',
        label: 'Image',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'name',
        label: 'Product',
        sortable: true,
        defaultVisible: true,
        required: true,
        className: 'font-bold',
      },
      {
        key: 'sku',
        label: 'SKU',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'category',
        label: 'Category',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'brand',
        label: 'Brand',
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'price',
        label: 'Price',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'stock',
        label: 'Stock',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
      {
        key: 'archivedAt',
        label: 'Archived Date',
        sortable: true,
        defaultVisible: true,
        className: 'font-bold',
      },
    ],
    []
  );

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'categoryId',
        label: 'Categories',
        type: 'select',
        options: [],
        placeholder: 'All Categories',
      },
      {
        key: 'brandId',
        label: 'Brands',
        type: 'select',
        options: [],
        placeholder: 'All Brands',
      },
    ],
    []
  );

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      categoryId: '',
      brandId: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newPageSize,
      page: 1,
    }));
  }, []);

  // Handle unarchive
  const handleUnarchiveProduct = useCallback(() => {
    if (!productToUnarchive) return;

    unarchiveProductMutation.mutate(productToUnarchive.id, {
      onSuccess: () => {
        toast.success(`Product "${productToUnarchive.name}" has been unarchived`);
        archivedProductsQuery.refetch();
        setUnarchiveDialogOpen(false);
        setProductToUnarchive(null);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to unarchive product');
      },
    });
  }, [productToUnarchive, unarchiveProductMutation, archivedProductsQuery]);

  // Helper function to get product image
  const getProductImage = (product: APIProduct): string => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      if (typeof product.images[0] === 'object' && 'url' in product.images[0]) {
        return (product.images[0] as any).url;
      }
      return product.images[0] as string;
    }
    return product.image || '';
  };

  // Get status badge
  const getStatusBadge = (status: APIProduct['status']) => {
    return <Badge variant="secondary" className="text-xs">Archived</Badge>;
  };

  // Render cell function
  const renderCell = useCallback(
    (product: APIProduct, columnKey: string) => {
      switch (columnKey) {
        case 'image':
          return (
            <div className="flex items-center justify-start">
              <ProductImage
                src={getProductImage(product)}
                alt={product.name}
                size="sm"
                className="h-10 w-10 sm:h-12 sm:w-12"
              />
            </div>
          );
        case 'name':
          return (
            <div className="min-w-0">
              <div className="font-medium text-xs sm:text-sm truncate">
                {product.name}
              </div>
              {product.brand && (
                <div className="text-xs text-muted-foreground truncate">
                  {product.brand.name}
                </div>
              )}
            </div>
          );
        case 'sku':
          return (
            <span className="font-mono text-xs sm:text-sm">
              {product.sku}
            </span>
          );
        case 'category':
          return (
            <span className="text-xs sm:text-sm">
              {product.category?.name || '-'}
            </span>
          );
        case 'brand':
          return (
            <span className="text-xs sm:text-sm">
              {product.brand?.name || '-'}
            </span>
          );
        case 'price':
          return (
            <span className="font-medium text-xs sm:text-sm">
              {formatCurrency(product.price)}
            </span>
          );
        case 'stock':
          return (
            <span className="text-xs sm:text-sm">
              {product.stock || 0}
            </span>
          );
        case 'archivedAt':
          return (
            <div>
              <div className="text-xs sm:text-sm">
                {product.archivedAt
                  ? new Date(product.archivedAt).toLocaleDateString()
                  : 'Unknown'}
              </div>
            </div>
          );
        default:
          return <span className="text-xs sm:text-sm">-</span>;
      }
    },
    []
  );

  // Render actions function
  const renderActions = useCallback(
    (product: APIProduct) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <IconDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link
              href={`/inventory/products/${product.id}`}
              className="flex items-center gap-2"
            >
              <IconEye className="h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setProductToUnarchive(product);
              setUnarchiveDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <IconArchiveOff className="h-4 w-4" />
            Unarchive Product
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    []
  );

  // Mobile card title and subtitle
  const mobileCardTitle = (product: APIProduct) => (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">
        <ProductImage
          src={getProductImage(product)}
          alt={product.name}
          size="sm"
          className="h-10 w-10"
        />
      </div>
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">
        {product.name}
      </span>
    </div>
  );

  const mobileCardSubtitle = (product: APIProduct) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="font-mono">{product.sku}</span>
      {product.brand && (
        <>
          <span>•</span>
          <span>{product.brand.name}</span>
        </>
      )}
      <span>•</span>
      <IconCalendar className="h-3 w-3" />
      <span>
        Archived {product.archivedAt ? new Date(product.archivedAt).toLocaleDateString() : 'Unknown'}
      </span>
    </div>
  );

  // Current pagination from API response
  const currentPagination = {
    page: archivedProductsQuery.data?.pagination?.page || pagination.page,
    limit: archivedProductsQuery.data?.pagination?.limit || pagination.limit,
    totalPages: archivedProductsQuery.data?.pagination?.totalPages || pagination.totalPages,
    totalItems: archivedProductsQuery.data?.pagination?.total || 0,
  };

  return (
    <>
      <DashboardPageLayout
        title="Archived Products"
        description="View and manage archived products"
        actions={
          <Button asChild variant="outline">
            <Link href="/inventory/products" className="flex items-center gap-2">
              <IconPackages className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Products</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Mobile-optimized Filters */}
          <MobileDashboardFiltersBar
            searchPlaceholder="Search archived products..."
            searchValue={filters.search}
            onSearchChange={value => handleFilterChange('search', value)}
            isSearching={isSearching}
            filters={filterConfigs}
            filterValues={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />

          {/* Mobile-optimized Table */}
          <MobileDashboardTable
            tableTitle="Archived Products"
            totalCount={currentPagination.totalItems}
            currentCount={products.length}
            columns={columns}
            visibleColumns={visibleColumns}
            onColumnsChange={setVisibleColumns}
            columnCustomizerKey="archived-products-visible-columns"
            data={products}
            renderCell={renderCell}
            renderActions={renderActions}
            pagination={currentPagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={archivedProductsQuery.isLoading}
            isRefetching={archivedProductsQuery.isFetching && !archivedProductsQuery.isLoading}
            error={archivedProductsQuery.error?.message}
            onRetry={() => archivedProductsQuery.refetch()}
            emptyStateIcon={
              <IconArchive className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            }
            emptyStateMessage="No archived products found"
            emptyStateAction={
              <Button asChild>
                <Link href="/inventory/products">
                  <IconPackages className="mr-2 h-4 w-4" />
                  Browse Products
                </Link>
              </Button>
            }
            mobileCardTitle={mobileCardTitle}
            mobileCardSubtitle={mobileCardSubtitle}
            keyExtractor={product => product.id}
          />
        </div>
      </DashboardPageLayout>

      {/* Unarchive Confirmation Dialog */}
      <AlertDialog open={unarchiveDialogOpen} onOpenChange={setUnarchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconArchiveOff className="h-5 w-5" />
              Unarchive Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unarchive "{productToUnarchive?.name}"? 
              This will restore the product to your active inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnarchiveProduct}
              disabled={unarchiveProductMutation.isPending}
            >
              {unarchiveProductMutation.isPending ? 'Unarchiving...' : 'Unarchive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}