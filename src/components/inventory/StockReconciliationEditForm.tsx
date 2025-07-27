'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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

interface ReconciliationItem {
  product: {
    id: number;
    name: string;
    sku: string;
  };
  systemCount: number;
  physicalCount: number;
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
        discrepancyReason: item.discrepancyReason || '',
        notes: item.notes || '',
      }));

      replace(items);
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
      discrepancyReason: '',
      notes: '',
    });

    setShowProductSearch(false);
    setSearchTerm('');
  };

  const calculateDiscrepancy = (systemCount: number, physicalCount: number) => {
    return physicalCount - systemCount;
  };

  const calculateTotalDiscrepancy = () => {
    return fields.reduce((total, item) => {
      const discrepancy = calculateDiscrepancy(
        item.systemCount,
        item.physicalCount
      );
      return total + discrepancy;
    }, 0);
  };

  const calculateEstimatedImpact = () => {
    return fields.reduce((total, item) => {
      const discrepancy = calculateDiscrepancy(
        item.systemCount,
        item.physicalCount
      );
      const product = products.find((p: Product) => p.id === item.productId);
      if (product) {
        return total + discrepancy * product.cost;
      }
      return total;
    }, 0);
  };

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
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Products ({fields.length})</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProductSearch(!showProductSearch)}
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </CardTitle>
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
                          No products found matching "{searchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Products Table */}
              {fields.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-center">System</TableHead>
                        <TableHead className="text-center">Physical</TableHead>
                        <TableHead className="text-center">
                          Discrepancy
                        </TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((item, index) => {
                        const systemCount = form.watch(
                          `items.${index}.systemCount`
                        );
                        const physicalCount = form.watch(
                          `items.${index}.physicalCount`
                        );
                        const discrepancy = calculateDiscrepancy(
                          systemCount,
                          physicalCount
                        );

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {item.productName}
                                </div>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.notes`}
                                  render={({ field }) => (
                                    <Input
                                      placeholder="Notes..."
                                      {...field}
                                      className="mt-1 text-xs"
                                    />
                                  )}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {item.productSku}
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.systemCount`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    min="0"
                                    className="w-20 text-center"
                                    disabled
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
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.physicalCount`}
                                render={({ field }) => (
                                  <Input
                                    type="number"
                                    min="0"
                                    className="w-20 text-center"
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
                              {(() => {
                                const badgeConfig =
                                  getDiscrepancyBadgeConfig(discrepancy);
                                return (
                                  <Badge variant={badgeConfig.variant}>
                                    {badgeConfig.label}
                                  </Badge>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`items.${index}.discrepancyReason`}
                                render={({ field }) => (
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <SelectTrigger className="min-w-48">
                                      <SelectValue placeholder="Select reason..." />
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
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
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
              ) : (
                <div className="text-muted-foreground py-8 text-center">
                  No products added yet. Use the "Add Product" button to get
                  started.
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Total Products</div>
                    <div className="text-2xl font-bold">{fields.length}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Total Discrepancy</div>
                    <div className="text-2xl font-bold">
                      {calculateTotalDiscrepancy() > 0 ? '+' : ''}
                      {calculateTotalDiscrepancy()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Estimated Impact</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(calculateEstimatedImpact())}
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
    </div>
  );
}
