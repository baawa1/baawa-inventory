'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useSupplierOptions } from '@/hooks/api/suppliers';
import { useAddStock } from '@/hooks/api/stock-mutations';

const addStockSchema = z.object({
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  costPerUnit: z.number().positive('Cost per unit must be positive'),
  supplierId: z.number().int().positive().optional(),
  purchaseDate: z.date().optional(),
  notes: z.string().optional(),
  referenceNo: z.string().optional(),
});

type AddStockFormData = z.infer<typeof addStockSchema>;

interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
  cost: number;
}

interface AddStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess?: () => void;
}

export function AddStockDialog({
  isOpen,
  onClose,
  product,
  onSuccess,
}: AddStockDialogProps) {
  // Use TanStack Query for suppliers data
  const { data: supplierOptions = [], isLoading: loadingSuppliers } =
    useSupplierOptions();

  // Convert options to supplier objects for compatibility
  const suppliers = supplierOptions.map(
    (option: { value: string; label: string }) => ({
      id: parseInt(option.value),
      name: option.label,
      isActive: true,
    })
  );

  const form = useForm<AddStockFormData>({
    resolver: zodResolver(addStockSchema),
    defaultValues: {
      quantity: 1,
      costPerUnit: product?.cost || 0,
      supplierId: undefined,
      purchaseDate: new Date(),
      notes: '',
      referenceNo: '',
    },
  });

  // TanStack Query mutation
  const addStockMutation = useAddStock();

  // Reset form when dialog opens or product changes
  useEffect(() => {
    if (isOpen && product) {
      form.reset({
        quantity: 1,
        costPerUnit: product.cost || 0,
        supplierId: form.getValues('supplierId'),
        purchaseDate: new Date(),
        notes: '',
        referenceNo: '',
      });
    }
  }, [isOpen, product, form]);

  const onSubmit = (data: AddStockFormData) => {
    if (!product) return;

    const stockData = {
      productId: product.id,
      quantity: data.quantity,
      costPerUnit: data.costPerUnit,
      supplierId:
        data.supplierId && data.supplierId > 0 ? data.supplierId : undefined,
      purchaseDate: data.purchaseDate
        ? format(data.purchaseDate, 'yyyy-MM-dd')
        : undefined,
      notes: data.notes || undefined,
      referenceNo: data.referenceNo || undefined,
    };

    addStockMutation.mutate(stockData, {
      onSuccess: result => {
        toast.success(result.message || 'Stock added successfully');
        form.reset({
          quantity: 1,
          costPerUnit: product?.cost || 0,
          supplierId: undefined,
          purchaseDate: new Date(),
          notes: '',
          referenceNo: '',
        });
        onSuccess?.();
        onClose();
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to add stock');
      },
    });
  };

  const totalCost = form.watch('quantity') * form.watch('costPerUnit');
  const newStock = (product?.stock || 0) + form.watch('quantity');

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
          <DialogDescription>
            Add new stock for {product?.name} (SKU: {product?.sku})
          </DialogDescription>
        </DialogHeader>

        {product && (
          <div className="bg-muted mb-4 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-muted-foreground text-sm">
                  SKU: {product.sku}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-sm">Current Stock</p>
                <Badge variant="secondary">{product.stock} units</Badge>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        {...field}
                        onChange={e =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costPerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per Unit (₦) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={e =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier (Optional)</FormLabel>
                  <Select
                    onValueChange={value =>
                      field.onChange(
                        value && value !== '0' ? parseInt(value) : undefined
                      )
                    }
                    value={field.value?.toString() || '0'}
                    disabled={loadingSuppliers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">No supplier</SelectItem>
                      {suppliers.map(
                        (supplier: {
                          id: number;
                          name: string;
                          isActive: boolean;
                        }) => (
                          <SelectItem
                            key={supplier.id}
                            value={supplier.id.toString()}
                          >
                            {supplier.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Purchase Date</FormLabel>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={date =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referenceNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Invoice/Receipt number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Invoice or receipt number for this purchase
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
                      placeholder="Additional notes about this stock addition..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg border p-4">
              <h4 className="mb-2 font-medium">Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Cost:</span>
                  <span className="font-medium">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>New Stock Count:</span>
                  <span className="font-medium">{newStock} units</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={addStockMutation.isPending}>
                {addStockMutation.isPending ? 'Adding...' : 'Add Stock'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
