'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconPlus,
  IconTrash,
  IconSearch,
  IconCalculator,
  IconDeviceFloppy,
  IconSend,
  IconFilter,
  IconChevronDown,
  IconX,
} from '@tabler/icons-react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FormLoading } from '@/components/ui/form-loading';
import { formatCurrency } from '@/lib/utils';
import { useProductSearch } from '@/hooks/useProductSearch';
import {
  useCreateStockReconciliation,
  useSubmitStockReconciliation,
  useInventorySnapshot,
  type InventorySnapshotRequest,
  type InventorySnapshotItem,
} from '@/hooks/api/stock-management';
import { useCategoriesWithHierarchy } from '@/hooks/api/categories';
import { DISCREPANCY_REASONS } from '@/lib/constants/stock-reconciliation';
import { getDiscrepancyBadgeConfig } from '@/lib/utils/badge-helpers';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import type { Category } from '@/hooks/api/categories';
import type { CreateStockReconciliationData } from '@/lib/validations/stock-management';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  calculateDiscrepancyMetrics,
  formatSignedUnits,
} from '@/lib/utils/stock-reconciliation';

const reconciliationItemSchema = z.object({
  productId: z.number().int().positive(),
  productName: z.string(),
  productSku: z.string(),
  systemCount: z.number().int().min(0),
  physicalCount: z.number().int().min(0),
  verified: z.boolean(),
  discrepancyReason: z.string().optional(),
  notes: z.string().optional(),
});

const reconciliationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(reconciliationItemSchema)
    .min(1, 'At least one product is required'),
});

type ReconciliationFormData = z.infer<typeof reconciliationSchema>;

interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
  cost: number;
}

export function StockReconciliationForm() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [snapshotParams, setSnapshotParams] =
    useState<Partial<InventorySnapshotRequest>>({});
  const [snapshotProductMap, setSnapshotProductMap] = useState<
    Record<number, InventorySnapshotItem>
  >({});
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const prefillRequestedRef = useRef(false);
  const router = useRouter();

  // TanStack Query hooks
  const { data: productsData, isLoading: isLoadingProducts } =
    useProductSearch(searchTerm);
  const { data: categoriesResponse, isLoading: categoriesLoading } =
    useCategoriesWithHierarchy();
  const snapshotQuery = useInventorySnapshot(snapshotParams);
  const createMutation = useCreateStockReconciliation();
  const submitMutation = useSubmitStockReconciliation();

  const products = useMemo(
    () => productsData?.data || [],
    [productsData?.data]
  );

  const categories: Category[] = useMemo(
    () => categoriesResponse?.data || [],
    [categoriesResponse?.data]
  );

  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    const traverse = (items: Category[] | undefined) => {
      if (!items) return;
      items.forEach(category => {
        map.set(category.id, category);
        traverse(category.children);
      });
    };
    traverse(categories);
    return map;
  }, [categories]);

  const flatCategoryOptions = useMemo(() => {
    const options: Array<{ id: number; label: string }> = [];
    const seen = new Set<number>();

    const traverse = (items: Category[] | undefined, depth = 0) => {
      if (!items) return;
      items.forEach(category => {
        if (seen.has(category.id)) {
          return;
        }
        seen.add(category.id);
        options.push({
          id: category.id,
          label: `${'— '.repeat(depth)}${category.name}`,
        });
        traverse(category.children, depth + 1);
      });
    };

    traverse(categories);
    return options;
  }, [categories]);

  const categoryLabelMap = useMemo(() => {
    const map = new Map<number, string>();
    flatCategoryOptions.forEach(option => {
      map.set(option.id, option.label.trim());
    });
    return map;
  }, [flatCategoryOptions]);

  const resolvedCategoryIds = useMemo(() => {
    if (selectedCategoryIds.length === 0) {
      return [] as number[];
    }

    const result = new Set<number>();

    const traverse = (category: Category | undefined) => {
      if (!category || result.has(category.id)) return;
      result.add(category.id);
      category.children?.forEach(child => traverse(child));
    };

    selectedCategoryIds.forEach(categoryId => {
      const category = categoryMap.get(categoryId);
      traverse(category);
    });

    return Array.from(result);
  }, [selectedCategoryIds, categoryMap]);

  const snapshotItems = snapshotQuery.data?.data || [];
  const snapshotPagination = snapshotQuery.data?.pagination;

  const form = useForm<ReconciliationFormData>({
    resolver: zodResolver(reconciliationSchema),
    defaultValues: {
      title: '',
      description: '',
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const rawWatchedItems = useWatch({
    control: form.control,
    name: 'items',
  }) as ReconciliationFormData['items'] | undefined;

  const watchedItems = useMemo(
    () => rawWatchedItems ?? [],
    [rawWatchedItems]
  );

  const costLookup = useMemo(() => {
    const map = new Map<number, number>();
    products.forEach((product: Product) => {
      map.set(product.id, Number(product.cost) || 0);
    });
    Object.values(snapshotProductMap).forEach((item: InventorySnapshotItem) => {
      map.set(item.id, Number(item.cost) || 0);
    });
    return map;
  }, [products, snapshotProductMap]);

  const discrepancyMetrics = useMemo(() => {
    const itemsForMetrics = watchedItems.map(item => {
      const systemCount = Number(item?.systemCount ?? 0);
      const physicalCount = Number(item?.physicalCount ?? 0);
      const discrepancy = physicalCount - systemCount;
      const cost = costLookup.get(item.productId) ?? 0;
      return {
        discrepancy,
        impact: discrepancy * cost,
      };
    });
    return calculateDiscrepancyMetrics(itemsForMetrics);
  }, [watchedItems, costLookup]);

  const filteredItemEntries = useMemo(() => {
    const query = itemSearch.trim().toLowerCase();
    if (!query) {
      return fields.map((item, index) => ({ item, index }));
    }

    return fields
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        const nameMatch = item.productName?.toLowerCase().includes(query);
        const skuMatch = item.productSku?.toLowerCase().includes(query);
        return Boolean(nameMatch || skuMatch);
      });
  }, [fields, itemSearch]);

  const hasActiveFilter = Boolean(itemSearch.trim());

  const productCountLabel = hasActiveFilter
    ? `${filteredItemEntries.length} / ${fields.length}`
    : `${fields.length}`;

  const totalPhysicalUnits = useMemo(() => {
    return watchedItems.reduce((total, item) => {
      return total + Number(item?.physicalCount ?? 0);
    }, 0);
  }, [watchedItems]);

  const toggleCategory = useCallback((categoryId: number) => {
    setSelectedCategoryIds(previous => {
      if (previous.includes(categoryId)) {
        return previous.filter(id => id !== categoryId);
      }
      return [...previous, categoryId];
    });
  }, []);

  const handleClearCategories = useCallback(() => {
    setSelectedCategoryIds([]);
    setSnapshotParams({});
    setSnapshotProductMap({});
    prefillRequestedRef.current = false;
    setIsCategoryPopoverOpen(false);
    setItemSearch('');
  }, []);

  const handleLoadProducts = useCallback(() => {
    if (selectedCategoryIds.length === 0) {
      toast.error('Select at least one category to load');
      return;
    }

    prefillRequestedRef.current = true;
    setIsCategoryPopoverOpen(false);
    setShowProductSearch(false);
    setItemSearch('');
    setSnapshotParams({
      categoryIds: resolvedCategoryIds,
      includeZero: true,
      status: 'ACTIVE',
      limit: 1000,
    });
  }, [resolvedCategoryIds, selectedCategoryIds.length]);

  const addProduct = (product: Product) => {
    const existingItem = fields.find(item => item.productId === product.id);
    if (existingItem) {
      toast.error('Product already added to reconciliation');
      return;
    }

    append({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      systemCount: product.stock,
      physicalCount: product.stock,
      verified: false,
      discrepancyReason: '',
      notes: '',
    });

    setShowProductSearch(false);
    setSearchTerm('');

    setSnapshotProductMap(previous => ({
      ...previous,
      [product.id]: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        systemCount: product.stock,
        physicalCount: product.stock,
        cost: product.cost,
        minStock: 0,
        category: null,
      },
    }));
  };

  const calculateDiscrepancy = (systemCount: number, physicalCount: number) => {
    return physicalCount - systemCount;
  };

  useEffect(() => {
    watchedItems.forEach((item, index) => {
      if (!item) {
        return;
      }

      const systemCount = Number(item.systemCount ?? 0);
      const physicalCount = Number(item.physicalCount ?? 0);
      const hasDiscrepancy = physicalCount !== systemCount;

      if (hasDiscrepancy && !item.verified) {
        form.setValue(`items.${index}.verified`, true, {
          shouldDirty: true,
          shouldTouch: false,
        });
      }
    });
  }, [watchedItems, form]);

  useEffect(() => {
    if (!prefillRequestedRef.current) {
      return;
    }

    if (snapshotQuery.isFetching) {
      return;
    }

    if (snapshotQuery.isError) {
      prefillRequestedRef.current = false;
      toast.error('Failed to load inventory snapshot');
      return;
    }

    const items: InventorySnapshotItem[] | undefined = snapshotQuery.data?.data;
    if (!items) {
      prefillRequestedRef.current = false;
      return;
    }

    const currentValues = form.getValues();
    form.reset({
      ...currentValues,
      items: items.map(item => ({
        productId: item.id,
        productName: item.name,
        productSku: item.sku,
        systemCount: item.systemCount,
        physicalCount: item.physicalCount,
        verified: false,
        discrepancyReason: '',
        notes: '',
      })),
    });

    setSnapshotProductMap(() => {
      const map: Record<number, InventorySnapshotItem> = {};
      items.forEach(item => {
        map[item.id] = item;
      });
      return map;
    });

    setItemSearch('');

    if (items.length === 0) {
      toast.info('No products found for the selected categories');
    } else {
      toast.success(`Loaded ${items.length} products for the selected categories`);
    }

    prefillRequestedRef.current = false;
  }, [form, snapshotQuery.data, snapshotQuery.isError, snapshotQuery.isFetching]);

  const onSubmit = async (data: ReconciliationFormData, saveAsDraft = true) => {
    try {
      // Calculate discrepancies and estimated impacts
      const itemsWithCalculations = data.items.map(item => {
        const discrepancy = calculateDiscrepancy(
          item.systemCount,
          item.physicalCount
        );
        const cost =
          products.find((p: Product) => p.id === item.productId)?.cost ??
          snapshotProductMap[item.productId]?.cost ??
          0;
        const estimatedImpact = discrepancy * cost;

        return {
          productId: item.productId,
          systemCount: item.systemCount,
          physicalCount: item.physicalCount,
          discrepancyReason: item.discrepancyReason,
          verified: item.verified ?? false,
          estimatedImpact,
          notes: item.notes,
        };
      });

      const reconciliationData: CreateStockReconciliationData = {
        title: data.title,
        description: data.description,
        notes: data.notes,
        items: itemsWithCalculations,
      };

      const result = await createMutation.mutateAsync(reconciliationData);

      // If not saving as draft, submit for approval immediately
      if (!saveAsDraft) {
        await submitMutation.mutateAsync(result.data.id);
        toast.success('Stock reconciliation submitted for approval');
      } else {
        toast.success('Stock reconciliation saved as draft');
      }

      // Navigate to the reconciliation detail page
      router.push(`/inventory/stock-reconciliations/${result.data.id}`);
    } catch (error) {
      console.error('Error creating reconciliation:', error);
      toast.error('Failed to create stock reconciliation');
    }
  };

  // Show loading state during form submission
  if (createMutation.isPending || submitMutation.isPending) {
    return (
      <FormLoading
        title="Create Stock Reconciliation"
        description="Create a new stock reconciliation to track inventory adjustments"
        backLabel="Back to Reconciliations"
        onBack={() => router.push('/inventory/stock-reconciliations')}
        backUrl="/inventory/stock-reconciliations"
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/inventory/stock-reconciliations')}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reconciliations
        </Button>
        <PageHeader
          title="Stock Reconciliation"
          description="Create a new stock reconciliation to track inventory discrepancies"
        />
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={e => e.preventDefault()}>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Details</CardTitle>
              <CardDescription>
                Enter the basic information for this stock reconciliation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Monthly Stock Count - January 2025"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A descriptive title for this reconciliation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Purpose and scope of this reconciliation..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description of the reconciliation purpose
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes or instructions..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Additional notes for this reconciliation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </CardContent>
        </Card>

          {/* Category Prefill */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFilter className="h-5 w-5" />
                Select Categories to Prefill
              </CardTitle>
              <CardDescription>
                Load current system counts for specific categories before you start counting.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1">
                  <FormLabel className="text-sm font-medium text-muted-foreground">
                    Categories
                  </FormLabel>
                  <Popover
                    open={isCategoryPopoverOpen}
                    onOpenChange={setIsCategoryPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className="mt-2 w-full justify-between"
                      >
                        <span>
                          {selectedCategoryIds.length > 0
                            ? `${selectedCategoryIds.length} categor${
                                selectedCategoryIds.length === 1 ? 'y' : 'ies'
                              } selected`
                            : 'Select categories'}
                        </span>
                        <IconChevronDown className="h-4 w-4 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search categories..." />
                        <CommandList>
                          <CommandEmpty>
                            {categoriesLoading
                              ? 'Loading categories...'
                              : 'No categories found'}
                          </CommandEmpty>
                          <CommandGroup heading="Categories">
                            {flatCategoryOptions.map(option => {
                              const isSelected =
                                selectedCategoryIds.includes(option.id);

                              return (
                                <CommandItem
                                  key={option.id}
                                  value={option.id.toString()}
                                  onSelect={() => toggleCategory(option.id)}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    className="pointer-events-none mr-2"
                                    tabIndex={-1}
                                  />
                                  <span className="truncate">{option.label}</span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearCategories}
                    disabled={
                      selectedCategoryIds.length === 0 &&
                      snapshotItems.length === 0
                    }
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    onClick={handleLoadProducts}
                    disabled={
                      selectedCategoryIds.length === 0 ||
                      snapshotQuery.isFetching ||
                      categoriesLoading
                    }
                  >
                    {snapshotQuery.isFetching && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {snapshotQuery.isFetching ? 'Loading…' : 'Load products'}
                  </Button>
                </div>
              </div>

              {selectedCategoryIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCategoryIds.map(categoryId => (
                    <Badge key={categoryId} variant="secondary">
                      <span className="mr-2">
                        {categoryLabelMap.get(categoryId) ||
                          `Category #${categoryId}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCategory(categoryId)}
                        className="text-muted-foreground transition hover:text-foreground"
                      >
                        <IconX className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {snapshotPagination?.nextCursor && (
                <p className="text-sm text-muted-foreground">
                  Showing the first {snapshotItems.length} products. Filter further to load fewer items at once.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Products ({fields.length})</CardTitle>
                  <CardDescription>
                    Add products to reconcile and enter their physical counts.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProductSearch(!showProductSearch)}
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>

              {fields.length > 0 && (
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:max-w-sm">
                    <IconSearch className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    {itemSearch && (
                      <button
                        type="button"
                        onClick={() => setItemSearch('')}
                        aria-label="Clear product filter"
                        className="text-muted-foreground absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition hover:text-foreground"
                      >
                        <IconX className="h-4 w-4" />
                      </button>
                    )}
                    <Input
                      value={itemSearch}
                      onChange={event => setItemSearch(event.target.value)}
                      placeholder="Search added products by name or SKU..."
                      className="pl-9 pr-9"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground md:text-right">
                    Showing {productCountLabel} products
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {/* Product Search */}
              {showProductSearch && (
                <div className="mb-4 rounded-lg border p-4">
                  <div className="mb-3 flex items-center space-x-2">
                    <IconSearch className="text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search products by name or SKU..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {isLoadingProducts ? (
                      <div className="text-muted-foreground py-4 text-center">
                        <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                        Loading products...
                      </div>
                    ) : (
                      <>
                        {products.map((product: Product) => (
                          <div
                            key={product.id}
                            className="hover:bg-muted flex items-center justify-between rounded p-2"
                          >
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-muted-foreground text-sm">
                                SKU: {product.sku} • Stock: {product.stock}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                addProduct(product);
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                        {products.length === 0 && searchTerm && (
                          <div className="text-muted-foreground py-4 text-center">
                            No products found matching &quot;{searchTerm}&quot;
                          </div>
                        )}
                        {products.length === 0 && !searchTerm && (
                          <div className="text-muted-foreground py-4 text-center">
                            Start typing to search for products...
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Products List */}
              {fields.length > 0 ? (
                <>
                  {filteredItemEntries.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center">
                      No products match your filter.
                    </div>
                  ) : (
                    <>
                      <div className="hidden md:block">
                    <div className="overflow-x-auto rounded-md border">
                      <Table className="min-w-[960px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-center">System</TableHead>
                            <TableHead className="text-center">Physical</TableHead>
                            <TableHead className="text-center">Verified</TableHead>
                            <TableHead className="text-center">Discrepancy</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="w-12">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItemEntries.map(({ item, index }) => {
                            const itemValues = watchedItems[index];
                            const systemCount = Number(itemValues?.systemCount ?? 0);
                            const physicalCount = Number(itemValues?.physicalCount ?? 0);
                            const discrepancy = calculateDiscrepancy(
                              systemCount,
                              physicalCount
                            );
                            const badgeConfig =
                              getDiscrepancyBadgeConfig(discrepancy);

                            return (
                              <TableRow key={item.id} className="align-top">
                                <TableCell className="max-w-xs whitespace-normal break-words">
                                  <p className="font-medium leading-snug">
                                    {item.productName}
                                  </p>
                                </TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">
                                  {item.productSku}
                                </TableCell>
                                <TableCell className="w-24">
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.systemCount`}
                                    render={({ field }) => (
                                      <Input
                                        type="number"
                                        min="0"
                                        disabled
                                        className="text-center"
                                        {...field}
                                        onChange={e =>
                                          field.onChange(
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="w-24">
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.physicalCount`}
                                    render={({ field }) => (
                                      <Input
                                        type="number"
                                        min="0"
                                        className="text-center"
                                        {...field}
                                        onChange={e =>
                                          field.onChange(
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.verified`}
                                    render={({ field }) => {
                                      const isDiscrepancy = discrepancy !== 0;
                                      const checked = isDiscrepancy
                                        ? true
                                        : Boolean(field.value);
                                      return (
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={value =>
                                            field.onChange(Boolean(value))
                                          }
                                          disabled={isDiscrepancy}
                                          aria-label="Mark product as verified"
                                          className="mx-auto"
                                        />
                                      );
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={badgeConfig.variant}>
                                    {badgeConfig.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="w-56">
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.discrepancyReason`}
                                    render={({ field }) => (
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select reason" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {DISCREPANCY_REASONS.map(reason => (
                                            <SelectItem
                                              key={reason.value}
                                              value={reason.value}
                                            >
                                              {reason.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="w-64">
                                  <FormField
                                    control={form.control}
                                    name={`items.${index}.notes`}
                                    render={({ field }) => (
                                      <Textarea
                                        rows={2}
                                        placeholder="Add optional context..."
                                        {...field}
                                      />
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <IconTrash className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="space-y-4 md:hidden">
                    {filteredItemEntries.map(({ item, index }) => {
                      const itemValues = watchedItems[index];
                      const systemCount = Number(itemValues?.systemCount ?? 0);
                      const physicalCount = Number(itemValues?.physicalCount ?? 0);
                      const discrepancy = calculateDiscrepancy(
                        systemCount,
                        physicalCount
                      );
                      const badgeConfig =
                        getDiscrepancyBadgeConfig(discrepancy);

                      return (
                        <div
                          key={`mobile-${item.id}`}
                          className="rounded-lg border bg-card p-4 shadow-sm"
                        >
                          <div className="space-y-3">
                            <div>
                              <p className="font-medium leading-snug break-words">
                                {item.productName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                SKU: {item.productSku}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">
                                  System
                                </span>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.systemCount`}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      min="0"
                                      disabled
                                      className="mt-1 text-center"
                                      {...field}
                                      onChange={e =>
                                        field.onChange(
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                    />
                                  )}
                                />
                              </div>
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">
                                  Physical
                                </span>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.physicalCount`}
                                  render={({ field }) => (
                                    <Input
                                      type="number"
                                      min="0"
                                      className="mt-1 text-center"
                                      {...field}
                                      onChange={e =>
                                        field.onChange(
                                          parseInt(e.target.value) || 0
                                        )
                                      }
                                    />
                                  )}
                                />
                              </div>
                            </div>

                            <FormField
                              control={form.control}
                              name={`items.${index}.verified`}
                              render={({ field }) => {
                                const isDiscrepancy = discrepancy !== 0;
                                const checked = isDiscrepancy
                                  ? true
                                  : Boolean(field.value);

                                return (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      Verified
                                    </span>
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={value =>
                                        field.onChange(Boolean(value))
                                      }
                                      disabled={isDiscrepancy}
                                      aria-label="Mark product as verified"
                                    />
                                  </div>
                                );
                              }}
                            />

                            <div className="grid grid-cols-2 items-end gap-3">
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">
                                  Discrepancy
                                </span>
                                <Badge
                                  variant={badgeConfig.variant}
                                  className="mt-1 justify-center"
                                >
                                  {badgeConfig.label}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">
                                  Reason
                                </span>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.discrepancyReason`}
                                  render={({ field }) => (
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select reason" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {DISCREPANCY_REASONS.map(reason => (
                                          <SelectItem
                                            key={reason.value}
                                            value={reason.value}
                                          >
                                            {reason.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                            </div>

                            <FormField
                              control={form.control}
                              name={`items.${index}.notes`}
                              render={({ field }) => (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Notes
                                  </span>
                                  <Textarea
                                    rows={2}
                                    placeholder="Add optional context..."
                                    className="mt-1"
                                    {...field}
                                  />
                                </div>
                              )}
                            />

                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <IconTrash className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground py-8 text-center">
                  No products added yet. Use the &quot;Add Product&quot; button
                  to get started.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {watchedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <IconCalculator className="mr-2 h-5 w-5" />
                  Summary
                </CardTitle>
                <CardDescription>
                  Overview of the reconciliation results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <div className="text-sm font-medium text-muted-foreground">
                      Total Products
                    </div>
                    <div className="text-2xl font-bold">
                      {watchedItems.length}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {totalPhysicalUnits.toLocaleString()} units counted
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <div className="text-sm font-medium text-muted-foreground">
                      Net Discrepancy
                    </div>
                    <div className="text-2xl font-bold">
                      {formatSignedUnits(discrepancyMetrics.netUnits)}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatCurrency(discrepancyMetrics.netImpact)}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-green-50 p-4">
                    <div className="text-sm font-medium text-green-700">
                      Overages
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {formatSignedUnits(discrepancyMetrics.overageUnits)}
                    </div>
                    <div className="text-green-700 text-xs">
                      {formatCurrency(discrepancyMetrics.overageImpact)}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-red-50 p-4">
                    <div className="text-sm font-medium text-red-700">
                      Shortages
                    </div>
                    <div className="text-2xl font-bold text-red-700">
                      {formatSignedUnits(-discrepancyMetrics.shortageUnits)}
                    </div>
                    <div className="text-red-700 text-xs">
                      {formatCurrency(-discrepancyMetrics.shortageImpact)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex flex-col items-stretch gap-3 pt-4 md:flex-row md:items-center md:justify-end md:gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/inventory/stock-reconciliations')}
              disabled={createMutation.isPending || submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={form.handleSubmit(data => onSubmit(data, true))}
              disabled={createMutation.isPending || submitMutation.isPending}
              className="md:w-auto"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <IconDeviceFloppy className="mr-2 h-4 w-4" />
                  Save Draft
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(data => onSubmit(data, false))}
              disabled={createMutation.isPending || submitMutation.isPending}
              className="md:w-auto"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <IconSend className="mr-2 h-4 w-4" />
                  Submit for Approval
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
