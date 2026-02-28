'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { InlineLoading } from '@/components/ui/loading';

interface ProductSalesItem {
  id: number;
  transactionId: number;
  transactionNumber: string;
  quantity: number;
  price: number;
  total: number;
  transactionDate: string;
  customerName?: string;
  staffName: string;
  paymentStatus: string;
}

interface ProductSalesDialogProps {
  productId: number | null;
  productName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductSalesDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: ProductSalesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [salesItems, setSalesItems] = useState<ProductSalesItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);

  useEffect(() => {
    if (open && productId) {
      loadSalesItems();
    }
  }, [open, productId]);

  const loadSalesItems = async () => {
    if (!productId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/sales`);
      if (!response.ok) throw new Error('Failed to load sales');

      const data = await response.json();
      setSalesItems(data.salesItems || []);
      setTotalRevenue(data.summary?.totalRevenue || 0);
      setTotalQuantity(data.summary?.totalQuantity || 0);
    } catch (error) {
      console.error('Failed to load product sales:', error);
      setSalesItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    if (normalizedStatus === 'completed' || normalizedStatus === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    } else if (normalizedStatus === 'partial') {
      return <Badge className="bg-amber-100 text-amber-800">Partial</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sales History: {productName}</DialogTitle>
          <DialogDescription>
            View all sales transactions for this product
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <InlineLoading label="Loading sales history..." />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Total Quantity Sold</div>
                <div className="text-2xl font-bold">{totalQuantity}</div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              </div>
            </div>

            {/* Sales Table */}
            {salesItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sales found for this product
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        #{item.transactionNumber}
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.transactionDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{item.customerName || 'Walk-in'}</TableCell>
                      <TableCell>{item.staffName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.total)}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.paymentStatus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="mt-4 text-sm text-muted-foreground text-right">
              Showing {salesItems.length} transaction{salesItems.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
