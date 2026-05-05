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
  IconBuildingBank,
  IconCash,
  IconCreditCard,
  IconDeviceMobile,
  IconTag,
} from '@tabler/icons-react';

export interface OrderDetailItem {
  id: number;
  name: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  total: number;
  totalPrice?: number;
  coupon?: {
    id: number;
    code: string;
    name: string;
    type: string;
    value: number;
  } | null;
}

export interface OrderDetailFee {
  id?: number;
  type: string;
  description?: string;
  amount: number;
  createdAt?: string;
}

export interface OrderDetail {
  id: number;
  transactionNumber: string;
  customerName?: string | null;
  staffName?: string;
  totalAmount: number;
  paymentMethod?: string;
  createdAt: string;
  itemCount?: number;
  items?: OrderDetailItem[];
  subtotal?: number;
  discount?: number;
  notes?: string | null;
  fees?: OrderDetailFee[];
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
    case 'pos':
    case 'card':
      return <IconCreditCard className="h-4 w-4 text-blue-600" />;
    case 'bank_transfer':
    case 'transfer':
      return <IconBuildingBank className="h-4 w-4 text-purple-600" />;
    case 'mobile_money':
    case 'mobile':
      return <IconDeviceMobile className="h-4 w-4 text-orange-600" />;
    default:
      return <IconCash className="h-4 w-4 text-gray-600" />;
  }
}

export function OrderDetailContent({
  order,
}: {
  order: OrderDetail;
}) {
  const items = order.items || [];
  const itemCount = order.itemCount ?? items.length;

  return (
    <div className="grid gap-4 text-sm">
      <DetailSection title="Order Summary">
        <div className="grid gap-3 md:grid-cols-3">
          <DetailMetric
            label="Total"
            value={formatCurrency(order.totalAmount)}
            accentClassName="text-green-600"
          />
          <DetailMetric label="Items" value={itemCount} />
          <DetailMetric
            label="Payment"
            value={getPaymentMethodLabel(order.paymentMethod)}
          />
        </div>
      </DetailSection>

      <DetailSection title="Order Information">
        <div className="grid gap-3 md:grid-cols-2">
          <DetailItem
            label="Reference"
            value={<span className="font-mono">{order.transactionNumber}</span>}
          />
          <DetailItem
            label="Date"
            value={format(new Date(order.createdAt), 'PPP p')}
          />
          <DetailItem
            label="Customer"
            value={order.customerName || 'Walk-in Customer'}
          />
          <DetailItem
            label="Payment Method"
            value={
              <span className="inline-flex items-center gap-2">
                {getPaymentMethodIcon(order.paymentMethod)}
                <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
              </span>
            }
          />
          {order.staffName ? (
            <DetailItem label="Staff" value={order.staffName} />
          ) : null}
        </div>
      </DetailSection>

      <DetailSection
        title={`Items Purchased${items.length ? ` (${items.length})` : ''}`}
      >
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map(item => {
              const unitAmount = item.unitPrice ?? item.price ?? 0;
              const totalAmount = item.totalPrice ?? item.total;

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 md:flex-row md:items-start md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {item.quantity} × {formatCurrency(unitAmount)}
                    </p>
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
                    <p className="font-semibold">{formatCurrency(totalAmount)}</p>
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
        ) : (
          <p className="text-muted-foreground">No line items available.</p>
        )}
      </DetailSection>

      {(order.subtotal !== undefined || order.discount || order.fees?.length) && (
        <DetailSection title="Amounts">
          <div className="space-y-2">
            {order.subtotal !== undefined ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
            ) : null}
            {order.discount && order.discount > 0 ? (
              <div className="flex items-center justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            ) : null}
            {order.fees?.map((fee, index) => (
              <div
                key={fee.id ?? `${fee.type}-${index}`}
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
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </DetailSection>
      )}

      {order.notes ? (
        <DetailNotice title="Notes" className="border-slate-200 bg-slate-50 text-slate-900">
          {order.notes}
        </DetailNotice>
      ) : null}
    </div>
  );
}
