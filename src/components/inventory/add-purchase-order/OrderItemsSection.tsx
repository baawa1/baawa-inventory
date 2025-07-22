"use client";

import { useState, useEffect } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CreatePurchaseOrderData, Product } from "./types";

interface OrderItemsSectionProps {
  form: UseFormReturn<CreatePurchaseOrderData>;
  products: Product[];
  loading: boolean;
}

export function OrderItemsSection({
  form,
  products,
  loading,
}: OrderItemsSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(
    new Set()
  );

  const addItem = () => {
    append({
      productId: undefined,
      variantId: undefined,
      quantityOrdered: 1,
      unitCost: 0,
      totalCost: 0,
    });
  };

  const removeItem = (index: number) => {
    const item = fields[index];
    if (item.productId) {
      setSelectedProducts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.productId!);
        return newSet;
      });
    }
    remove(index);
  };

  const handleProductChange = (
    index: number,
    productId: number | undefined
  ) => {
    if (productId) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        form.setValue(`items.${index}.unitCost`, product.cost);
        form.setValue(
          `items.${index}.totalCost`,
          product.cost * form.getValues(`items.${index}.quantityOrdered`)
        );
        setSelectedProducts((prev) => new Set([...prev, productId]));
      }
    } else {
      form.setValue(`items.${index}.unitCost`, 0);
      form.setValue(`items.${index}.totalCost`, 0);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const unitCost = form.getValues(`items.${index}.unitCost`);
    form.setValue(`items.${index}.totalCost`, unitCost * quantity);
  };

  const handleUnitCostChange = (index: number, unitCost: number) => {
    const quantity = form.getValues(`items.${index}.quantityOrdered`);
    form.setValue(`items.${index}.totalCost`, unitCost * quantity);
  };

  // Calculate totals
  const subtotal = fields.reduce((sum, _, index) => {
    return sum + (form.getValues(`items.${index}.totalCost`) || 0);
  }, 0);

  // Update form subtotal using useEffect to avoid setState during render
  useEffect(() => {
    form.setValue("subtotal", subtotal);
  }, [subtotal, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Item {index + 1}</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeItem(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name={`items.${index}.productId`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const productId = value ? parseInt(value) : undefined;
                        field.onChange(productId);
                        handleProductChange(index, productId);
                      }}
                      value={field.value?.toString() || ""}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loading ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Loading products...
                          </div>
                        ) : (
                          products
                            .filter(
                              (product) =>
                                !selectedProducts.has(product.id) ||
                                product.id === field.value
                            )
                            .map((product) => (
                              <SelectItem
                                key={product.id}
                                value={product.id.toString()}
                              >
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.quantityOrdered`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        {...field}
                        onChange={(e) => {
                          const quantity = parseInt(e.target.value) || 0;
                          field.onChange(quantity);
                          handleQuantityChange(index, quantity);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.unitCost`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost (₦) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          const unitCost = parseFloat(e.target.value) || 0;
                          field.onChange(unitCost);
                          handleUnitCostChange(index, unitCost);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.totalCost`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Cost (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        readOnly
                        className="bg-gray-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>

        {fields.length > 0 && (
          <div className="border-t pt-4">
            <div className="text-right">
              <p className="text-lg font-semibold">
                Subtotal: {formatCurrency(subtotal)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
