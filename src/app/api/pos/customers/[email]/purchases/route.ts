import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';
import { prisma } from '@/lib/db';
import { PAYMENT_STATUS } from '@/lib/constants';

interface CustomerPurchase {
  id: number;
  transactionNumber: string;
  totalAmount: number;
  createdAt: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
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
        items: transaction.sales_items.map(item => ({
          productName: item.products?.name || 'Unknown Product',
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          totalPrice: Number(item.total_price),
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
