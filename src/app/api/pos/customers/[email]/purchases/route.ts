import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';
import { prisma } from '@/lib/db';
import { PAYMENT_STATUS } from '@/lib/constants';

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const session = await auth();
    const { email } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view customer data
    if (!['ADMIN', 'MANAGER', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const customerEmail = decodeURIComponent(email);

    // Fetch all transactions for this customer with their items
    const transactions = await prisma.salesTransaction.findMany({
      where: {
        customer_email: customerEmail,
        payment_status: PAYMENT_STATUS.PAID,
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

    // Transform the data into the format expected by the frontend
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
