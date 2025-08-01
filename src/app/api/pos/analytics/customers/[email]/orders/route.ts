import { NextResponse } from 'next/server';
import { withPOSAuth, AuthenticatedRequest } from '@/lib/api-auth-middleware';
import { prisma } from '@/lib/db';

export const GET = withPOSAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: { email: string } }
  ) => {
    try {
      const customerEmail = decodeURIComponent(params.email);

      // Get all orders for this customer
      const orders = await prisma.salesTransaction.findMany({
        where: {
          customer_email: customerEmail,
          payment_status: {
            in: ['paid', 'completed', 'PAID'], // Include all successful payment statuses
          },
        },
        include: {
          sales_items: {
            include: {
              products: {
                select: {
                  name: true,
                  sku: true,
                  price: true,
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
          users: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Transform the data to match the expected format
      const transformedOrders = orders.map(order => ({
        id: order.id,
        transactionNumber: order.transaction_number || `TXN-${order.id}`,
        timestamp: order.created_at,
        customerName: order.customer_name || 'Unknown Customer',
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        staffName: order.users
          ? `${order.users.firstName} ${order.users.lastName}`
          : 'Unknown Staff',
        paymentMethod: order.payment_method || 'cash',
        paymentStatus: order.payment_status,
        subtotal: Number(order.subtotal || 0),
        discount: Number(order.discount_amount || 0),
        total: Number(order.total_amount || 0),
        notes: order.notes,
        items: order.sales_items.map((item: any) => ({
          id: item.id,
          name: item.products?.name || 'Unknown Product',
          sku: item.products?.sku || 'N/A',
          price: Number(item.unit_price || 0),
          quantity: item.quantity,
          total: Number(item.total_price || 0),
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
      }));

      return NextResponse.json({
        success: true,
        data: transformedOrders,
      });
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch customer orders',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);
