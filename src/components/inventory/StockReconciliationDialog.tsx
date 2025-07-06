"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconPlus,
  IconTrash,
  IconSearch,
  IconCalculator,
} from "@tabler/icons-react";
import { formatCurrency } from "@/lib/utils";
import { useProductSearch } from "@/hooks/useProductSearch";
import {
  useCreateStockReconciliation,
  useSubmitStockReconciliation,
} from "@/hooks/api/stock-management";
import { DISCREPANCY_REASONS } from "@/lib/constants/stock-reconciliation";

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
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(reconciliationItemSchema)
    .min(1, "At least one product is required"),
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
  const [searchTerm, setSearchTerm] = useState("");

  // TanStack Query hooks
  const { data: productsData, isLoading: _loadingProducts } =
    useProductSearch(searchTerm);
  const createMutation = useCreateStockReconciliation();
  const submitMutation = useSubmitStockReconciliation();

  const products = productsData?.data || [];

  const form = useForm<ReconciliationFormData>({
    resolver: zodResolver(reconciliationSchema),
    defaultValues: {
      title: "",
      description: "",
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleSearchProducts = (search: string) => {
    setSearchTerm(search);
  };

  const addProduct = (product: Product) => {
    // Check if product is already added
    const existingItem = fields.find((item) => item.productId === product.id);
    if (existingItem) {
      toast.error("Product already added to reconciliation");
      return;
    }

    append({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      systemCount: product.stock,
      physicalCount: product.stock,
      discrepancyReason: "",
      notes: "",
    });
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

  const onSubmit = async (data: ReconciliationFormData, saveAsDraft = true) => {
    try {
      // Calculate discrepancies and estimated impacts
      const itemsWithCalculations = data.items.map((item) => {
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
        title: data.title,
        description: data.description,
        notes: data.notes,
        items: itemsWithCalculations,
      } as any; // Type assertion to work with the API

      const result = await createMutation.mutateAsync(reconciliationData);

      // If not saving as draft, submit for approval immediately
      if (!saveAsDraft) {
        await submitMutation.mutateAsync(result.reconciliation.id);
        toast.success("Stock reconciliation submitted for approval");
      } else {
        toast.success("Stock reconciliation saved as draft");
      }

      form.reset();
      onSuccess?.();
      onClose();
    } catch (_error) {
      toast.error("Failed to create stock reconciliation");
    }
  };

  const handleSaveDraft = () => {
    form.handleSubmit((data) => onSubmit(data, true))();
  };

  const handleSubmitForApproval = () => {
    form.handleSubmit((data) => onSubmit(data, false))();
  };

  const isLoading = createMutation.isPending || submitMutation.isPending;
  const totalDiscrepancy = calculateTotalDiscrepancy();
  const estimatedImpact = calculateEstimatedImpact();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Stock Reconciliation</DialogTitle>
          <DialogDescription>
            Count your physical inventory and reconcile discrepancies with the
            system
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        onChange={(e) => handleSearchProducts(e.target.value)}
                      />
                    </div>
                  </div>

                  {searchTerm && products.length > 0 && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {products.map((product: Product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted cursor-pointer"
                          onClick={() => addProduct(product)}
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              SKU: {product.sku} | Current Stock:{" "}
                              {product.stock}
                            </p>
                          </div>
                          <Button size="sm" type="button">
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>System Count</TableHead>
                          <TableHead>Physical Count</TableHead>
                          <TableHead>Discrepancy</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((item, index) => {
                          const discrepancy = calculateDiscrepancy(
                            item.systemCount,
                            item.physicalCount
                          );
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {item.productName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.productSku}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.systemCount`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="0"
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(
                                              parseInt(e.target.value) || 0
                                            )
                                          }
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.physicalCount`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="0"
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(
                                              parseInt(e.target.value) || 0
                                            )
                                          }
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    discrepancy === 0
                                      ? "secondary"
                                      : discrepancy > 0
                                        ? "default"
                                        : "destructive"
                                  }
                                >
                                  {discrepancy > 0 ? "+" : ""}
                                  {discrepancy}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.discrepancyReason`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select reason..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {DISCREPANCY_REASONS.map((reason) => (
                                              <SelectItem key={reason.value} value={reason.value}>
                                                {reason.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.notes`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          placeholder="Additional notes"
                                          {...field}
                                        />
                                      </FormControl>
                                    </FormItem>
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

                  {/* Summary */}
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Reconciliation Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Total Products:
                        </span>
                        <p className="font-medium">{fields.length}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Total Discrepancy:
                        </span>
                        <p
                          className={`font-medium ${totalDiscrepancy === 0 ? "text-green-600" : totalDiscrepancy > 0 ? "text-blue-600" : "text-red-600"}`}
                        >
                          {totalDiscrepancy > 0 ? "+" : ""}
                          {totalDiscrepancy} units
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Estimated Impact:
                        </span>
                        <p
                          className={`font-medium ${estimatedImpact === 0 ? "text-green-600" : estimatedImpact > 0 ? "text-blue-600" : "text-red-600"}`}
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

            <DialogFooter className="space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={isLoading || fields.length === 0}
              >
                {isLoading ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={isLoading || fields.length === 0}
              >
                {isLoading ? "Submitting..." : "Submit for Approval"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
