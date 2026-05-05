'use client';

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  DetailItem,
  DetailMetric,
  DetailNotice,
  DetailSection,
} from '@/components/ui/detail-dialog';
import { formatCurrency } from '@/lib/utils';
import {
  ReceiptPrinter,
  type ReceiptData,
} from '@/components/pos/ReceiptPrinter';
import {
  IconBuildingBank,
  IconCash,
  IconCheck,
  IconClock,
  IconCreditCard,
  IconDeviceMobile,
  IconTag,
  IconX,
} from '@tabler/icons-react';

export interface POSCoupon {
  id: number;
  code: string;
  name: string;
  type: string;
  value: number;
}

export interface POSTransactionItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  basePrice?: number | null;
  unitPrice?: number | null;
  originalPrice?: number | null;
  overrideReason?: string | null;
  priceOverrideReason?: string | null;
  note?: string | null;
  coupon?: POSCoupon | null;
}

export interface POSTransactionFee {
  type: string;
  description?: string;
  amount: number;
}

export interface POSTransactionDetail {
  id: number;
  transactionNumber: string;
  staffName: string;
  customerName?: string;
  customerEmail: string | null;
  items: POSTransactionItem[];
  subtotal: number;
  discount: number;
  fees?: POSTransactionFee[];
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

function getPaymentMethodLabel(method?: string | null) {
  if (!method) {
    return 'N/A';
  }

  return method
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function getPaymentMethodIcon(method?: string | null) {
  switch (method?.toLowerCase()) {
    case 'cash':
      return <IconCash className="h-4 w-4 text-green-600" />;
    case 'card':
    case 'pos':
      return <IconCreditCard className="h-4 w-4 text-blue-600" />;
    case 'transfer':
    case 'bank_transfer':
      return <IconBuildingBank className="h-4 w-4 text-purple-600" />;
    case 'mobile':
    case 'mobile_money':
      return <IconDeviceMobile className="h-4 w-4 text-orange-600" />;
    default:
      return <IconCash className="h-4 w-4 text-gray-600" />;
  }
}

function getPaymentStatusBadge(status?: string) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <IconCheck className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <IconClock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <IconX className="mr-1 h-3 w-3" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status || 'Unknown'}</Badge>;
  }
}

export function TransactionDetailContent({
  transaction,
  receiptData,
}: {
  transaction: POSTransactionDetail;
  receiptData: ReceiptData;
}) {
  return (
    <div className="grid gap-4 text-sm">
      <DetailSection title="Transaction Summary">
        <div className="grid gap-3 md:grid-cols-3">
          <DetailMetric
            label="Total"
            value={formatCurrency(transaction.total)}
            accentClassName="text-green-600"
          />
          <DetailMetric label="Items" value={transaction.items.length} />
          <DetailMetric
            label="Status"
            value={getPaymentStatusBadge(transaction.paymentStatus)}
          />
        </div>
      </DetailSection>

      <DetailSection title="Transaction Information">
        <div className="grid gap-3 md:grid-cols-2">
          <DetailItem
            label="Reference"
            value={<span className="font-mono">{transaction.transactionNumber}</span>}
          />
          <DetailItem
            label="Date"
            value={format(new Date(transaction.createdAt), 'PPP p')}
          />
          <DetailItem label="Staff" value={transaction.staffName} />
          <DetailItem
            label="Customer"
            value={transaction.customerName || 'Walk-in Customer'}
          />
          <DetailItem
            label="Payment Method"
            value={
              <span className="inline-flex items-center gap-2">
                {getPaymentMethodIcon(transaction.paymentMethod)}
                <span>{getPaymentMethodLabel(transaction.paymentMethod)}</span>
              </span>
            }
          />
          <DetailItem
            label="Payment Status"
            value={getPaymentStatusBadge(transaction.paymentStatus)}
          />
        </div>
      </DetailSection>

      <DetailSection title={`Items (${transaction.items.length})`}>
        <div className="space-y-3">
          {transaction.items.map(item => {
            const basePrice =
              item.basePrice ??
              item.unitPrice ??
              item.originalPrice ??
              item.price;
            const overrideReason =
              item.overrideReason ??
              item.priceOverrideReason ??
              item.note ??
              undefined;
            const hasOverride = Math.abs(item.price - basePrice) > 0.009;

            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 md:flex-row md:items-start md:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground text-sm">SKU: {item.sku}</p>
                  {overrideReason ? (
                    <p className="text-muted-foreground text-xs">
                      Override reason: {overrideReason}
                    </p>
                  ) : null}
                  {item.coupon ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <IconTag className="mr-1 h-3 w-3" />
                        {item.coupon.code}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {item.coupon.name}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="text-left md:text-right">
                  {hasOverride ? (
                    <div className="flex flex-col md:items-end">
                      <span className="text-muted-foreground text-xs line-through">
                        {formatCurrency(basePrice)} × {item.quantity}
                      </span>
                      <span className="font-medium text-emerald-600">
                        {formatCurrency(item.price)} × {item.quantity}
                      </span>
                    </div>
                  ) : (
                    <p className="font-medium">
                      {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  )}
                  <p className="font-semibold">{formatCurrency(item.total)}</p>
                  {item.coupon ? (
                    <p className="text-xs text-green-600">
                      {item.coupon.type === 'PERCENTAGE'
                        ? `${item.coupon.value}% off`
                        : `${formatCurrency(item.coupon.value)} off`}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </DetailSection>

      <DetailSection title="Amounts">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">
              {formatCurrency(transaction.subtotal)}
            </span>
          </div>
          {transaction.discount > 0 ? (
            <div className="flex items-center justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(transaction.discount)}</span>
            </div>
          ) : null}
          {transaction.fees?.map((fee, index) => (
            <div
              key={`${fee.type}-${index}`}
              className="flex items-center justify-between text-orange-600"
            >
              <span>
                {fee.type}
                {fee.description ? ` (${fee.description})` : ''}
              </span>
              <span>{formatCurrency(fee.amount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(transaction.total)}</span>
          </div>
        </div>
      </DetailSection>

      {!transaction.customerEmail ? (
        <DetailNotice title="Receipt Email">
          This transaction has no customer email, so email receipt options are
          unavailable.
        </DetailNotice>
      ) : null}

      <DetailSection title="Actions">
        <div className="flex flex-wrap gap-2">
          <ReceiptPrinter
            receiptData={receiptData}
            showEmailOption={!!transaction.customerEmail}
          />
        </div>
      </DetailSection>
    </div>
  );
}
