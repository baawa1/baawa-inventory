'use client';

import { useState, useEffect, useMemo } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  IconDeviceFloppy,
  IconSend,
  IconX,
} from '@tabler/icons-react';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FormLoading } from '@/components/ui/form-loading';
import { formatCurrency } from '@/lib/utils';
import { useProductSearch } from '@/hooks/useProductSearch';
import {
  useStockReconciliation,
  useUpdateStockReconciliation,
  useSubmitStockReconciliation,
} from '@/hooks/api/stock-management';
import { DISCREPANCY_REASONS } from '@/lib/constants/stock-reconciliation';
import { getDiscrepancyBadgeConfig } from '@/lib/utils/badge-helpers';
import { Checkbox } from '@/components/ui/checkbox';
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

interface ReconciliationItem {
  product: {
    id: number;
    name: string;
    sku: string;
  };
  systemCount: number;
  physicalCount: number;
  verified?: boolean;
  discrepancyReason?: string;
  notes?: string;
}

interface StockReconciliationEditFormProps {
  reconciliationId: number;
}

export function StockReconciliationEditForm({
  reconciliationId,
}: StockReconciliationEditFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const router = useRouter();

  // TanStack Query hooks
  const { data: reconciliationData, isLoading: loadingReconciliation } =
    useStockReconciliation(reconciliationId.toString());
  const { data: productsData, isLoading: _loadingProducts } =
    useProductSearch(searchTerm);
  const updateMutation = useUpdateStockReconciliation();
  const submitMutation = useSubmitStockReconciliation();

  const reconciliation = reconciliationData?.data;
  const products = productsData?.data || [];

  const form = useForm<ReconciliationFormData>({
    resolver: zodResolver(reconciliationSchema),
    defaultValues: {
      title: '',
      description: '',
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
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

  const discrepancyMetrics = useMemo(() => {
    const itemsForMetrics = watchedItems.map(item => {
      const systemCount = Number(item?.systemCount ?? 0);
      const physicalCount = Number(item?.physicalCount ?? 0);
      const discrepancy = physicalCount - systemCount;
      const product = products.find((p: Product) => p.id === item?.productId);
      const cost = product?.cost ? Number(product.cost) : 0;
      return {
        discrepancy,
        impact: discrepancy * cost,
      };
    });

    return calculateDiscrepancyMetrics(itemsForMetrics);
  }, [watchedItems, products]);

  const verifiedSummary = useMemo(() => {
    return watchedItems.reduce(
      (acc, item) => {
        if (item?.verified) {
          acc.units += Number(item.physicalCount ?? 0);
          acc.items += 1;
        }
        return acc;
      },
      { units: 0, items: 0 }
    );
  }, [watchedItems]);

  // Load reconciliation data into form
  useEffect(() => {
    if (reconciliation) {
      form.setValue('title', reconciliation.title);
      form.setValue('description', reconciliation.description || '');
      form.setValue('notes', reconciliation.notes || '');

      const items = reconciliation.items.map((item: ReconciliationItem) => ({
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        systemCount: item.systemCount,
        physicalCount: item.physicalCount,
        verified: Boolean((item as any)?.verified),
        discrepancyReason: item.discrepancyReason || '',
        notes: item.notes || '',
      }));

      replace(items);
      setItemSearch('');
    }
  }, [reconciliation, form, replace]);

  // Check if reconciliation can be edited
  const canEdit = reconciliation?.status === 'DRAFT';

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
  };

  const calculateDiscrepancy = (systemCount: number, physicalCount: number) => {
    return physicalCount - systemCount;
  };

  useEffect(() => {
    watchedItems.forEach((item, index) => {
      if (!item) return;

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

  const onSubmit = async (
    data: ReconciliationFormData,
    submitForApproval = false
  ) => {
    try {
      // Calculate discrepancies and estimated impacts
      const itemsWithCalculations = data.items.map(item => {
        const discrepancy = calculateDiscrepancy(
          item.systemCount,
          item.physicalCount
        );
        const product = products.find((p: Product) => p.id === item.productId);
        const estimatedImpact = product ? discrepancy * product.cost : 0;

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

      const reconciliationData = {
        id: reconciliationId.toString(),
        title: data.title,
        description: data.description,
        notes: data.notes,
        items: itemsWithCalculations,
      } as any; // Type assertion to work with the API

      await updateMutation.mutateAsync(reconciliationData);

      // If submitting for approval, also submit
      if (submitForApproval) {
        await submitMutation.mutateAsync(reconciliationId);
        toast.success(
          'Stock reconciliation updated and submitted for approval'
        );
      } else {
        toast.success('Stock reconciliation updated successfully');
      }

      // Navigate back to the reconciliation detail page
      router.push(`/inventory/stock-reconciliations/${reconciliationId}`);
    } catch (error) {
      console.error('Error updating reconciliation:', error);
      toast.error('Failed to update stock reconciliation');
    }
  };

  if (loadingReconciliation) {
    return (
      <FormLoading
        title="Edit Stock Reconciliation"
        description="Loading reconciliation..."
        backLabel="Back to Reconciliations"
        onBack={() => router.push('/inventory/stock-reconciliations')}
        backUrl="/inventory/stock-reconciliations"
      />
    );
  }

  // Show loading state during form submission
  if (updateMutation.isPending || submitMutation.isPending) {
    return (
      <FormLoading
        title="Edit Stock Reconciliation"
        description="Updating reconciliation..."
        backLabel="Back to Reconciliations"
        onBack={() => router.push('/inventory/stock-reconciliations')}
        backUrl="/inventory/stock-reconciliations"
      />
    );
  }

  if (!reconciliation) {
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
            title="Edit Stock Reconciliation"
            description="Reconciliation not found"
          />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4 text-lg">
                Reconciliation not found
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/inventory/stock-reconciliations')}
              >
                Back to Reconciliations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() =>
              router.push(
                `/inventory/stock-reconciliations/${reconciliationId}`
              )
            }
            className="mb-4 px-4 lg:px-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reconciliation
          </Button>
          <PageHeader
            title="Edit Stock Reconciliation"
            description="Cannot edit this reconciliation"
          />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4 text-lg">
                This reconciliation cannot be edited (Status:{' '}
                {reconciliation.status})
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/inventory/stock-reconciliations/${reconciliationId}`
                  )
                }
              >
                View Reconciliation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() =>
            router.push(`/inventory/stock-reconciliations/${reconciliationId}`)
          }
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reconciliation
        </Button>
        <PageHeader
          title="Edit Stock Reconciliation"
          description={`Update "${reconciliation.title}" reconciliation details`}
        />
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={e => e.preventDefault()}>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Details</CardTitle>
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

          {/* Product Selection */}
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Products ({fields.length})</CardTitle>
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

                  {searchTerm && (
                    <div className="max-h-48 space-y-2 overflow-y-auto">
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
                      {products.length === 0 && (
                        <div className="text-muted-foreground py-4 text-center">
                          No products found matching &quot;{searchTerm}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Products Table */}
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
                                    size="sm"
                                    onClick={() => remove(index)}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <IconTrash className="h-4 w-4" />
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
          {fields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <IconCalculator className="mr-2 h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <div className="text-sm font-medium text-muted-foreground">
                      Total Products
                    </div>
                    <div className="text-2xl font-bold">{fields.length}</div>
                    <div className="text-muted-foreground text-xs">
                      {totalPhysicalUnits.toLocaleString()} units counted
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {verifiedSummary.units.toLocaleString()} units verified
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {verifiedSummary.items} / {watchedItems.length} items verified
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(
                  `/inventory/stock-reconciliations/${reconciliationId}`
                )
              }
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={form.handleSubmit(data => onSubmit(data, false))}
              disabled={updateMutation.isPending || submitMutation.isPending}
            >
              <IconDeviceFloppy className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(data => onSubmit(data, true))}
              disabled={updateMutation.isPending || submitMutation.isPending}
            >
              <IconSend className="mr-2 h-4 w-4" />
              {submitMutation.isPending
                ? 'Submitting...'
                : 'Save & Submit for Approval'}
            </Button>
          </div>
        </form>
      </Form>

      {watchedItems.length > 0 && (
        <div className="pointer-events-none fixed bottom-24 right-4 z-50 w-60 sm:bottom-10 sm:right-10">
          <div className="bg-background/95 text-foreground rounded-xl border p-4 shadow-lg">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Verified Progress
            </p>
            <p className="mt-1 text-2xl font-bold">
              {verifiedSummary.units.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Units verified • {verifiedSummary.items} / {watchedItems.length} items
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
