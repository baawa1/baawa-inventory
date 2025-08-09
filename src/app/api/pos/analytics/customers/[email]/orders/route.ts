import { NextResponse } from 'next/server';
import { withPOSAuth, AuthenticatedRequest } from '@/lib/api-auth-middleware';
import { prisma } from '@/lib/db';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

export const GET = withPOSAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ email: string }> }
  ) => {
    const resolvedParams = await params;
    try {
      const customerEmail = decodeURIComponent(resolvedParams.email);

      // Get all orders for this customer
      const orders = await prisma.salesTransaction.findMany({
        where: {
          customer: {
            email: customerEmail,
          },
          payment_status: {
            in: SUCCESSFUL_PAYMENT_STATUSES,
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
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
          transaction_fees: {
            select: {
              id: true,
              feeType: true,
              description: true,
              amount: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'asc',
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
        customerName: order.customer?.name || 'Unknown Customer',
        customerEmail: order.customer?.email || null,
        customerPhone: order.customer?.phone || null,
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
        fees:
          order.transaction_fees?.map((fee: any) => ({
            id: fee.id,
            type: fee.feeType,
            description: fee.description,
            amount: Number(fee.amount),
            createdAt: fee.createdAt,
          })) || [],
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
