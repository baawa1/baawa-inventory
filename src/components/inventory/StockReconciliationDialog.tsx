'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  IconFilter,
  IconLoader2,
  IconX,
  IconChevronDown,
} from '@tabler/icons-react';
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
import type { CreateStockReconciliationData } from '@/lib/validations/stock-management';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import type { Category } from '@/hooks/api/categories';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const reconciliationItemSchema = z.object({
  productId: z.number().int().positive(),
  productName: z.string(),
  productSku: z.string(),
  systemCount: z.number().int().min(0),
  physicalCount: z.number().int().min(0),
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

interface StockReconciliationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StockReconciliationDialog({
  isOpen,
  onClose,
  onSuccess,
}: StockReconciliationDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [snapshotParams, setSnapshotParams] =
    useState<Partial<InventorySnapshotRequest>>({});
  const [snapshotProductMap, setSnapshotProductMap] = useState<
    Record<number, InventorySnapshotItem>
  >({});
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const prefillRequestedRef = useRef(false);

  // TanStack Query hooks
  const { data: productsData, isLoading: _loadingProducts } =
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

  const handleSearchProducts = (search: string) => {
    setSearchTerm(search);
  };

  const toggleCategory = useCallback(
    (categoryId: number) => {
      setSelectedCategoryIds(previous => {
        if (previous.includes(categoryId)) {
          return previous.filter(id => id !== categoryId);
        }
        return [...previous, categoryId];
      });
    },
    [setSelectedCategoryIds]
  );

  const handleClearCategories = useCallback(() => {
    setSelectedCategoryIds([]);
    setSnapshotParams({});
    setSnapshotProductMap({});
    prefillRequestedRef.current = false;
    setIsCategoryPopoverOpen(false);
  }, []);

  const handleLoadProducts = useCallback(() => {
    if (selectedCategoryIds.length === 0) {
      toast.error('Select at least one category to load');
      return;
    }

    prefillRequestedRef.current = true;
    setIsCategoryPopoverOpen(false);
    setSnapshotParams({
      categoryIds: resolvedCategoryIds,
      includeZero: true,
      status: 'ACTIVE',
      limit: 1000,
    });
  }, [selectedCategoryIds, resolvedCategoryIds]);

  const addProduct = (product: Product) => {
    // Check if product is already added
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
      discrepancyReason: '',
      notes: '',
    });

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

  const totalDiscrepancy = useMemo(() => {
    if (!watchedItems.length) return 0;
    return watchedItems.reduce((total, item) => {
      const systemCount = Number(item?.systemCount ?? 0);
      const physicalCount = Number(item?.physicalCount ?? 0);
      return total + calculateDiscrepancy(systemCount, physicalCount);
    }, 0);
  }, [watchedItems]);

  const estimatedImpact = useMemo(() => {
    if (!watchedItems.length) return 0;
    return watchedItems.reduce((total, item) => {
      const productId = item?.productId;
      const systemCount = Number(item?.systemCount ?? 0);
      const physicalCount = Number(item?.physicalCount ?? 0);
      const discrepancy = calculateDiscrepancy(systemCount, physicalCount);
      const cost =
        products.find((p: Product) => p.id === productId)?.cost ??
        snapshotProductMap[productId]?.cost ??
        0;
      return total + discrepancy * cost;
    }, 0);
  }, [watchedItems, products, snapshotProductMap]);

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

    if (items.length === 0) {
      toast.info('No products found for the selected categories');
    } else {
      toast.success(
        `Loaded ${items.length} products for the selected categories`
      );
    }

    prefillRequestedRef.current = false;
  }, [form, snapshotQuery.data, snapshotQuery.isError, snapshotQuery.isFetching]);

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        title: '',
        description: '',
        notes: '',
        items: [],
      });
      setSearchTerm('');
      setSelectedCategoryIds([]);
      setSnapshotParams({});
      setSnapshotProductMap({});
      prefillRequestedRef.current = false;
      setIsCategoryPopoverOpen(false);
    }
  }, [form, isOpen]);

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

      form.reset();
      onSuccess?.();
      onClose();
    } catch (_error) {
      toast.error('Failed to create stock reconciliation');
    }
  };

  const handleSaveDraft = () => {
    form.handleSubmit(data => onSubmit(data, true))();
  };

  const handleSubmitForApproval = () => {
    form.handleSubmit(data => onSubmit(data, false))();
  };

  const isLoading = createMutation.isPending || submitMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Stock Reconciliation</DialogTitle>
          <DialogDescription>
            Count your physical inventory and reconcile discrepancies with the
            system
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={e => e.preventDefault()}>
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      <Input
                        placeholder="Brief description of this reconciliation"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconFilter className="h-5 w-5" />
                  Select Categories to Prefill
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Choose the categories you are counting right now.
                      </p>
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
                                    selectedCategoryIds.length === 1
                                      ? 'y'
                                      : 'ies'
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
                                      <span className="truncate">
                                        {option.label}
                                      </span>
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
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
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
                      Showing the first {snapshotItems.length} products. Use
                      narrower categories to keep the list manageable.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Search and Add */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconSearch className="h-5 w-5" />
                  Add Products to Reconciliation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Search products by name or SKU..."
                        value={searchTerm}
                        onChange={e => handleSearchProducts(e.target.value)}
                      />
                    </div>
                  </div>

                  {searchTerm && products.length > 0 && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border">
                      {products.map((product: Product) => (
                        <div
                          key={product.id}
                          className="hover:bg-muted flex items-center justify-between border-b p-3 last:border-b-0"
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-muted-foreground text-sm">
                              SKU: {product.sku} | Current Stock:{' '}
                              {product.stock}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            type="button"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              addProduct(product);
                            }}
                          >
                            <IconPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reconciliation Items */}
            {fields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconCalculator className="h-5 w-5" />
                    Products to Reconcile ({fields.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {fields.length > 0 && (
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
                                <TableHead className="text-center">Discrepancy</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="w-12">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {fields.map((item, index) => {
                                const itemValues = watchedItems[index];
                                const discrepancy = calculateDiscrepancy(
                                  Number(itemValues?.systemCount ?? 0),
                                  Number(itemValues?.physicalCount ?? 0)
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
                        {fields.map((item, index) => {
                          const itemValues = watchedItems[index];
                          const discrepancy = calculateDiscrepancy(
                            Number(itemValues?.systemCount ?? 0),
                            Number(itemValues?.physicalCount ?? 0)
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
                                    size="sm"
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

                  {/* Summary */}
                  <div className="bg-muted mt-4 rounded-lg p-4">
                    <h4 className="mb-2 font-medium">Reconciliation Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div>
                        <span className="text-muted-foreground">
                          Total Products:
                        </span>
                        <p className="font-medium">{watchedItems.length}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Total Discrepancy:
                        </span>
                        <p
                          className={`font-medium ${totalDiscrepancy === 0 ? 'text-green-600' : totalDiscrepancy > 0 ? 'text-blue-600' : 'text-red-600'}`}
                        >
                          {totalDiscrepancy > 0 ? '+' : ''}
                          {totalDiscrepancy} units
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Estimated Impact:
                        </span>
                        <p
                          className={`font-medium ${estimatedImpact === 0 ? 'text-green-600' : estimatedImpact > 0 ? 'text-blue-600' : 'text-red-600'}`}
                        >
                          {formatCurrency(Math.abs(estimatedImpact))}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="secondary">Draft</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* General Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this reconciliation..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Any additional information about this stock reconciliation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={isLoading || !watchedItems.length}
                className="sm:w-auto"
              >
                {isLoading ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={isLoading || !watchedItems.length}
                className="sm:w-auto"
              >
                {isLoading ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
