'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// Hooks
import { useDebounce } from '@/hooks/useDebounce';
import { useProducts, type Product as APIProduct } from '@/hooks/api/products';
import { useBrands } from '@/hooks/api/brands';
import { useCategoriesWithHierarchy } from '@/hooks/api/categories';
import { useSupplierOptions } from '@/hooks/api/suppliers';
import { useSyncEntity, useSyncAllEntities } from '@/hooks/api/useWebhookSync';

// Permissions
import { usePermissions } from '@/hooks/usePermissions';

// UI Components
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

// Mobile-optimized components
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { MobileDashboardFiltersBar, FilterConfig } from '@/components/layouts/MobileDashboardFiltersBar';
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

// Custom Components
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AddStockDialog } from '@/components/inventory/AddStockDialog';
import { ProductDetailModal } from '@/components/inventory/ProductDetailModal';
import { PRODUCT_COLUMNS } from '@/components/inventory/ColumnCustomizer';
import { InlinePriceEditor } from '@/components/inventory/InlinePriceEditor';
import { ProductImage } from '@/components/ui/product-image';

// Enhanced mobile card templates
import { 
  MobileCardTitle, 
  ProductIconWrapper, 
  MobileCardSubtitle, 
  MobileCardHighlight,
  MobileCardContent 
} from '@/components/ui/mobile-card-templates';

// Utils
import { formatCurrency } from '@/lib/utils';
import { useMobileScrollAnchor } from '@/lib/utils/performance';

// Icons
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconAlertTriangle,
  IconArchive,
  IconPackages,
} from '@tabler/icons-react';

// Utils and Types
import { formatCategoryHierarchy } from '@/lib/utils/category';
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

interface MobileProductListProps {
  user: User;
}

interface ProductFilters {
  search: string;
  categoryId: string;
  brandId: string;
  status: string;
  supplier: string;
  lowStock: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'stock-asc', label: 'Stock (Low to High)' },
  { value: 'stock-desc', label: 'Stock (High to Low)' },
  { value: 'price-asc', label: 'Price (Low to High)' },
  { value: 'price-desc', label: 'Price (High to Low)' },
];

const MobileProductList = ({ user }: MobileProductListProps) => {
  const searchParams = useSearchParams();

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  const { anchorRef: pageTopRef, scrollToAnchor: scrollToTopIfMobile } =
    useMobileScrollAnchor();

  // Get permissions using centralized hook
  const permissions = usePermissions();
  const { canViewCost, canManageProducts, canEditProducts } = permissions;

  const [filters, setFilters] = useState<ProductFilters>(() => {
    // Initialize filters based on URL parameters
    const lowStockParam = searchParams.get('lowStock');
    return {
      search: '',
      categoryId: '',
      brandId: '',
      status: '',
      supplier: '',
      lowStock: lowStockParam === 'true',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
  });

  // Dialog states
  const [addStockDialogOpen, setAddStockDialogOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] =
    useState<APIProduct | null>(null);
  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<
    number | null
  >(null);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(filters.search, 300);
  const isSearching = filters.search !== debouncedSearchTerm;

  // TanStack Query hooks
  const productsQuery = useProducts(
    {
      search: debouncedSearchTerm,
      categoryId: filters.categoryId,
      brandId: filters.brandId,
      status: filters.status,
      supplier: filters.supplier,
      lowStock: filters.lowStock,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    },
    {
      page: pagination.page,
      limit: pagination.limit,
    }
  );

  const brandsQuery = useBrands({ status: 'true' });
  const categoriesQuery = useCategoriesWithHierarchy();
  const { data: supplierOptions = [] } = useSupplierOptions();

  // Sync hooks
  const syncEntityMutation = useSyncEntity();
  const syncAllEntitiesMutation = useSyncAllEntities();

  // Handle sync success/error
  useEffect(() => {
    if (syncEntityMutation.isSuccess) {
      toast.success(
        syncEntityMutation.data?.message || 'Product synced successfully'
      );
    }
    if (syncEntityMutation.isError) {
      toast.error(
        syncEntityMutation.error?.message || 'Failed to sync product'
      );
    }
  }, [
    syncEntityMutation.isSuccess,
    syncEntityMutation.isError,
    syncEntityMutation.data,
    syncEntityMutation.error,
  ]);

  useEffect(() => {
    if (syncAllEntitiesMutation.isSuccess) {
      toast.success(
        syncAllEntitiesMutation.data?.message ||
          'All products synced successfully'
      );
    }
    if (syncAllEntitiesMutation.isError) {
      toast.error(
        syncAllEntitiesMutation.error?.message || 'Failed to sync all products'
      );
    }
  }, [
    syncAllEntitiesMutation.isSuccess,
    syncAllEntitiesMutation.isError,
    syncAllEntitiesMutation.data,
    syncAllEntitiesMutation.error,
  ]);

  // Extract data from queries - memoized to prevent unnecessary re-renders
  const products = useMemo(
    () => productsQuery.data?.data || [],
    [productsQuery.data?.data]
  );
  const brands = useMemo(
    () => brandsQuery.data?.data || [],
    [brandsQuery.data?.data]
  );
  const categories = useMemo(
    () => categoriesQuery.data?.data || [],
    [categoriesQuery.data?.data]
  );

  // Filter available columns based on permissions
  const availableColumns = useMemo(() => {
    return PRODUCT_COLUMNS.filter(column => {
      // Hide cost column if user doesn't have cost permissions
      if (column.key === 'cost' && !canViewCost) {
        return false;
      }
      return true;
    });
  }, [canViewCost]);

  // Memoize category options to prevent unnecessary re-renders
  const categoryOptions = useMemo(
    () =>
      categories.map(cat => ({
        value: String(cat.id),
        label: formatCategoryHierarchy(cat),
      })),
    [categories]
  );

  // Memoize brand options to prevent unnecessary re-renders
  const brandOptions = useMemo(
    () =>
      brands.map(brand => ({
        value: String(brand.id),
        label: brand.name,
      })),
    [brands]
  );

  // Static status options - memoized to prevent unnecessary re-renders
  const statusOptions = useMemo(
    () => [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
      { value: 'DISCONTINUED', label: 'Discontinued' },
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
        options: categoryOptions,
        placeholder: 'All Categories',
      },
      {
        key: 'brandId',
        label: 'Brands',
        type: 'select',
        options: brandOptions,
        placeholder: 'All Brands',
        searchable: true,
        searchPlaceholder: 'Search brands...',
        emptyMessage: 'No brands found',
      },
      {
        key: 'supplier',
        label: 'Suppliers',
        type: 'select',
        options: supplierOptions,
        placeholder: 'All Suppliers',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: statusOptions,
        placeholder: 'All Status',
      },
    ],
    [categoryOptions, brandOptions, supplierOptions, statusOptions]
  );

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => {
      const filterKey = key as keyof ProductFilters;
      if (prev[filterKey] === value) return prev;
      return { ...prev, [filterKey]: value };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      categoryId: '',
      brandId: '',
      status: '',
      supplier: '',
      lowStock: false,
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
    if (pagination.page === newPage) return;
    setPagination(prev => ({ ...prev, page: newPage }));
    scrollToTopIfMobile();
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (pagination.limit === newPageSize && pagination.page === 1) return;
    setPagination(prev => ({
      ...prev,
      limit: newPageSize,
      page: 1,
    }));
    scrollToTopIfMobile();
  };

  // Helper function to get product image - moved outside render for better performance
  const getProductImage = (product: APIProduct): string => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      // Check if it's the new format (array of objects)
      if (typeof product.images[0] === 'object' && 'url' in product.images[0]) {
        return (product.images[0] as any).url;
      }
      // Legacy format (array of strings)
      return product.images[0] as string;
    }
    return product.image || '';
  };

  // Archive product handler
  const handleArchiveProduct = async (
    productId: number,
    productName: string
  ) => {
    try {
      const response = await fetch(`/api/products/${productId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archived: true,
          reason: `Archived by ${user.role}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive product');
      }

      toast.success(`Product "${productName}" has been archived`);
      productsQuery.refetch();
    } catch (err) {
      ErrorHandlers.api(err, 'Failed to archive product');
    }
  };

  const getStatusBadge = (status: APIProduct['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="default" className="bg-green-500">
            Active
          </Badge>
        );
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'OUT_OF_STOCK':
        return (
          <Badge variant="secondary" className="bg-yellow-500">
            Out of Stock
          </Badge>
        );
      case 'DISCONTINUED':
        return (
          <Badge variant="secondary" className="bg-gray-500">
            Discontinued
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStockStatus = (product: APIProduct) => {
    const stock = product.stock || 0;
    const minStock = product.minStock || 0;
    
    if (stock === 0) {
      return {
        icon: <IconAlertTriangle className="h-4 w-4 text-red-500" />,
        text: 'Out of stock',
        color: 'text-red-500',
      };
    } else if (stock <= minStock) {
      return {
        icon: <IconAlertTriangle className="h-4 w-4 text-yellow-500" />,
        text: 'Low stock',
        color: 'text-yellow-500',
      };
    }
    return {
      icon: <IconPackages className="h-4 w-4 text-green-500" />,
      text: 'In stock',
      color: 'text-green-500',
    };
  };

  const truncateText = (text: string, maxChars: number) => {
    const graphemes = Array.from(text);
    if (graphemes.length <= maxChars) {
      return text;
    }
    return `${graphemes.slice(0, maxChars).join('').trimEnd()}…`;
  };

  const renderCell = (product: APIProduct, columnKey: string) => {
    switch (columnKey) {
      case 'image':
        return (
          <div className="flex items-center justify-start">
            <ProductImage
              src={getProductImage(product)}
              alt={product.name}
              size="sm"
              className="sm:h-12 sm:w-12"
            />
          </div>
        );
      case 'name':
        const truncatedName = truncateText(product.name, 25);
        return (
          <div className="min-w-0">
            <div
              className="font-medium truncate"
              title={product.name}
            >
              {truncatedName}
            </div>
            {product.brand && (
              <div className="text-xs sm:text-sm text-muted-foreground truncate">
                {product.brand.name}
              </div>
            )}
          </div>
        );
      case 'sku':
        return <span className="font-mono text-xs sm:text-sm">{product.sku}</span>;
      case 'category':
        const categoryWithHierarchy = categories.find(
          cat => cat.id === product.category?.id
        );
        return (
          <span className="text-xs sm:text-sm">
            {categoryWithHierarchy
              ? formatCategoryHierarchy(categoryWithHierarchy)
              : product.category?.name || '-'}
          </span>
        );
      case 'brand':
        return <span className="text-xs sm:text-sm">{product.brand?.name || '-'}</span>;
      case 'stock':
        const stockStatus = getStockStatus(product);
        return (
          <div className="flex items-center gap-1 sm:gap-2">
            {stockStatus.icon}
            <span className={`${stockStatus.color} text-xs sm:text-sm font-medium`}>
              {product.stock || 0}
            </span>
          </div>
        );
      case 'pricing':
        return (
          <InlinePriceEditor
            product={{
              id: product.id,
              name: product.name,
              cost: product.cost || 0,
              price: product.price || 0,
            }}
            canEdit={canViewCost && canEditProducts}
            showProfitMargin={canViewCost}
          />
        );
      case 'price':
        return (
          <div className="text-xs sm:text-sm font-medium">
            {formatCurrency(product.price || 0)}
          </div>
        );
      case 'cost':
        return <span className="text-xs sm:text-sm">{formatCurrency(product.cost || 0)}</span>;
      case 'status':
        return getStatusBadge(product.status);
      case 'supplier':
        return <span className="text-xs sm:text-sm">{product.supplier?.name || '-'}</span>;
      default:
        return <span className="text-xs sm:text-sm">-</span>;
    }
  };

  const renderActions = (product: APIProduct) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <IconDots className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => {
            setSelectedProductForDetail(product.id);
            setProductDetailModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <IconEye className="h-4 w-4" />
          View Details
        </DropdownMenuItem>
        {canEditProducts && (
          <>
            <DropdownMenuItem asChild>
              <Link
                href={`/inventory/products/${product.id}/edit`}
                className="flex items-center gap-2"
              >
                <IconEdit className="h-4 w-4" />
                Edit Product
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedProductForStock(product);
                setAddStockDialogOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <IconPackages className="h-4 w-4" />
              Add Stock
            </DropdownMenuItem>
          </>
        )}
        {canManageProducts && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleArchiveProduct(product.id, product.name)}
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Enhanced mobile card title and subtitle
  const mobileCardTitle = (product: APIProduct) => {
    const truncatedName = truncateText(product.name, 25);
    const highlights = [
      <MobileCardHighlight
        key="stock"
        label="Stock"
        value={product.stock || 0}
        variant={product.stock === 0 ? 'danger' : product.stock <= 10 ? 'warning' : 'success'}
      />,
      <MobileCardHighlight
        key="price"
        label="Price"
        value={formatCurrency(product.price)}
        variant="default"
      />
    ];

    return (
      <MobileCardContent
        title={
          <MobileCardTitle
            icon={
              <div className="relative">
                <ProductImage
                  src={getProductImage(product)}
                  alt={product.name}
                  size="md"
                  className="h-11 w-11 rounded-lg"
                />
              </div>
            }
            title={truncatedName}
            subtitle={`SKU: ${product.sku}`}
          />
        }
        highlights={highlights}
        actions={
          canEditProducts && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Add edit functionality
                }}
                className="h-8 w-8 p-0"
              >
                <IconEdit className="h-4 w-4" />
              </Button>
            </div>
          )
        }
      />
    );
  };

  const mobileCardSubtitle = (product: APIProduct) => {
    const items = [
      { label: 'Category', value: product.category?.name || 'No Category' },
    ];

    if (product.brand) {
      items.push({ label: 'Brand', value: product.brand.name });
    }

    if (product.supplier) {
      items.push({ label: 'Supplier', value: product.supplier.name });
    }

    return <MobileCardSubtitle items={items} maxItems={3} />;
  };

  // Update pagination state when API response changes
  useEffect(() => {
    if (productsQuery.data?.pagination) {
      const apiPagination = productsQuery.data.pagination;
      setPagination(prev => ({
        ...prev,
        totalPages:
          apiPagination.totalPages ||
          Math.ceil((apiPagination.total || 0) / prev.limit),
        totalItems: apiPagination.total || 0,
      }));
    }
  }, [productsQuery.data?.pagination]);

  return (
    <ErrorBoundary>
      <div ref={pageTopRef}>
        <DashboardPageLayout
          title="Products"
          description="Manage your product inventory and stock levels"
          actions={
            canManageProducts ? (
              <div className="flex flex-row items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="hidden sm:flex items-center gap-2"
                >
                  <Link href="/inventory/products/archived">
                    <IconArchive className="h-4 w-4" />
                    <span className="hidden md:inline">View Archived</span>
                  </Link>
                </Button>
                <Button asChild>
                  <Link
                    href="/inventory/products/add"
                    className="flex items-center gap-2"
                  >
                    <IconPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Product</span>
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
              searchPlaceholder="Search products..."
              searchValue={filters.search}
              onSearchChange={value => handleFilterChange('search', value)}
              isSearching={isSearching}
              filters={filterConfigs}
              filterValues={filters as unknown as Record<string, unknown>}
              onFilterChange={(key: string, value: unknown) =>
                handleFilterChange(key, value as string | boolean)
              }
              onResetFilters={handleResetFilters}
              quickFilters={
                <Button
                  variant={filters.lowStock ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('lowStock', !filters.lowStock)}
                  className="text-xs"
                >
                  <IconAlertTriangle className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Low Stock</span>
                  <span className="sm:hidden">Low</span>
                </Button>
              }
              sortOptions={SORT_OPTIONS}
              currentSort={`${filters.sortBy}-${filters.sortOrder}`}
              onSortChange={handleSortChange}
            />

            {/* Mobile-optimized Table */}
            <MobileDashboardTable
              tableTitle="Products"
              totalCount={pagination.totalItems}
              currentCount={products.length}
              columns={availableColumns}
              visibleColumns={visibleColumns}
              onColumnsChange={setVisibleColumns}
              columnCustomizerKey="products-visible-columns"
              data={products}
              renderCell={renderCell}
              renderActions={renderActions}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              isLoading={productsQuery.isLoading}
              isRefetching={productsQuery.isFetching && !productsQuery.isLoading}
              error={productsQuery.error?.message}
              onRetry={() => productsQuery.refetch()}
              emptyStateIcon={
                <IconPackages className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              }
              emptyStateMessage="No products found"
              emptyStateAction={
                canManageProducts ? (
                  <Button asChild>
                    <Link href="/inventory/products/add">Add Your First Product</Link>
                  </Button>
                ) : undefined
              }
              mobileCardTitle={mobileCardTitle}
              mobileCardSubtitle={mobileCardSubtitle}
              keyExtractor={product => product.id}
            />
          </div>

          {/* Dialogs */}
          <AddStockDialog
            isOpen={addStockDialogOpen}
            onClose={() => {
              setAddStockDialogOpen(false);
              setSelectedProductForStock(null);
            }}
            product={selectedProductForStock}
            onSuccess={() => {
              productsQuery.refetch();
            }}
          />
          <ProductDetailModal
            productId={selectedProductForDetail}
            open={productDetailModalOpen}
            onCloseAction={() => {
              setProductDetailModalOpen(false);
              setSelectedProductForDetail(null);
            }}
            onAddStock={productId => {
              const product = products?.find(p => p.id === productId);
              if (product) {
                setSelectedProductForStock(product);
                setAddStockDialogOpen(true);
                setProductDetailModalOpen(false);
                setSelectedProductForDetail(null);
              }
            }}
          />
        </DashboardPageLayout>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(MobileProductList);
