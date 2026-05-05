'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { InlineLoading } from '@/components/ui/loading';
import {
  detailDialogContentClassName,
  DetailItem,
  DetailMetric,
  DetailSection,
} from '@/components/ui/detail-dialog';

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
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    try {
      const response = await fetch(`/api/products/${productId}/sales`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load sales');
      }

      const data = payload?.data ?? payload ?? {};
      setSalesItems(data.salesItems || []);
      setTotalRevenue(data.summary?.totalRevenue || 0);
      setTotalQuantity(data.summary?.totalQuantity || 0);
    } catch (error) {
      console.error('Failed to load product sales:', error);
      setSalesItems([]);
      setTotalRevenue(0);
      setTotalQuantity(0);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load product sales.'
      );
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
      <DialogContent className={detailDialogContentClassName}>
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
          <div className="grid gap-4 text-sm">
            <DetailSection title="Sales Summary">
              <div className="grid gap-3 md:grid-cols-3">
                <DetailMetric label="Quantity Sold" value={totalQuantity} />
                <DetailMetric
                  label="Total Revenue"
                  value={formatCurrency(totalRevenue)}
                  accentClassName="text-green-600"
                />
                <DetailMetric label="Transactions" value={salesItems.length} />
              </div>
            </DetailSection>

            <DetailSection
              title={`Transactions${salesItems.length ? ` (${salesItems.length})` : ''}`}
            >
              {error ? (
                <p className="text-destructive">{error}</p>
              ) : salesItems.length === 0 ? (
                <p className="text-muted-foreground">
                  No sales found for this product.
                </p>
              ) : (
                <div className="space-y-3">
                  {salesItems.map(item => (
                    <div
                      key={item.id}
                      className="rounded-lg border bg-muted/20 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <DetailItem
                            label="Transaction"
                            value={
                              <span className="font-mono">
                                #{item.transactionNumber}
                              </span>
                            }
                          />
                          <div className="grid gap-3 md:grid-cols-2">
                            <DetailItem
                              label="Date"
                              value={format(
                                new Date(item.transactionDate),
                                'PPP p'
                              )}
                            />
                            <DetailItem
                              label="Customer"
                              value={item.customerName || 'Walk-in'}
                            />
                            <DetailItem label="Staff" value={item.staffName} />
                            <DetailItem
                              label="Status"
                              value={getStatusBadge(item.paymentStatus)}
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 text-left md:min-w-44 md:text-right">
                          <DetailItem label="Quantity" value={item.quantity} />
                          <DetailItem
                            label="Unit Price"
                            value={formatCurrency(item.price)}
                          />
                          <DetailItem
                            label="Total"
                            value={
                              <span className="text-base font-semibold text-green-600">
                                {formatCurrency(item.total)}
                              </span>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DetailSection>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
