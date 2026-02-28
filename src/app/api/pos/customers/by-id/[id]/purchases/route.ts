import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';
import { prisma } from '@/lib/db';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

interface CustomerPurchase {
  id: number;
  transactionNumber: string;
  totalAmount: number;
  createdAt: string;
  notes?: string | null;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    coupon?: {
      id: number;
      code: string;
      name: string;
      type: string;
      value: number;
    } | null;
  }[];
}

const parseCustomerId = (rawId: string) => {
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return id;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'MANAGER', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customerId = parseCustomerId(id);
    if (!customerId) {
      return NextResponse.json(
        { error: 'Invalid customer id' },
        { status: 400 }
      );
    }

    const transactions = await prisma.salesTransaction.findMany({
      where: {
        customer_id: customerId,
        payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
      },
      include: {
        sales_items: {
          include: {
            products: {
              select: {
                name: true,
              },
            },
            coupon: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
                value: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const customerPurchases: CustomerPurchase[] = transactions.map(
      transaction => ({
        id: transaction.id,
        transactionNumber: transaction.transaction_number,
        totalAmount: Number(transaction.total_amount),
        createdAt:
          transaction.created_at?.toISOString() || new Date().toISOString(),
        notes: transaction.notes,
        items: transaction.sales_items.map(item => ({
          productName: item.products?.name || 'Unknown Product',
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          totalPrice: Number(item.total_price),
          coupon: item.coupon
            ? {
                id: item.coupon.id,
                code: item.coupon.code,
                name: item.coupon.name,
                type: item.coupon.type,
                value: Number(item.coupon.value),
              }
            : null,
        })),
      })
    );

    return NextResponse.json(customerPurchases);
  } catch (error) {
    console.error('Error fetching customer purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer purchases' },
      { status: 500 }
    );
  }
}
