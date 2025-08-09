import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return createApiResponse.error('Date parameter is required', 400);
    }

    // Parse the date and create start/end of day
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get orders for the specific date
    const orders = await prisma.salesTransaction.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        payment_status: {
          in: SUCCESSFUL_PAYMENT_STATUSES,
        },
      },
      select: {
        id: true,
        transaction_number: true,

        customer_id: true,
        total_amount: true,
        payment_method: true,
        created_at: true,
        customer: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            customerType: true,
          },
        },
        transaction_fees: {
          select: {
            feeType: true,
            description: true,
            amount: true,
          },
        },
        sales_items: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Format the response
    const formattedOrders = orders.map((order: any) => {
      const itemCount = order.sales_items.reduce(
        (total: number, item: any) => total + item.quantity,
        0
      );

      const feesTotal =
        order.transaction_fees?.reduce(
          (total: number, fee: any) => total + Number(fee.amount),
          0
        ) || 0;

      return {
        id: order.id,
        transactionNumber: order.transaction_number,
        customerName: order.customer?.name || order.customer_name,
        customerEmail: order.customer_email,
        customerCity: order.customer?.city,
        customerState: order.customer?.state,
        customerType: order.customer?.customerType,
        totalAmount: Number(order.total_amount),
        feesTotal,
        fees:
          order.transaction_fees?.map((fee: any) => ({
            type: fee.feeType,
            description: fee.description,
            amount: Number(fee.amount),
          })) || [],
        paymentMethod: order.payment_method,
        createdAt: order.created_at?.toISOString(),
        itemCount,
      };
    });

    return createApiResponse.success(
      {
        orders: formattedOrders,
        date,
        totalOrders: formattedOrders.length,
        totalAmount: formattedOrders.reduce(
          (sum, order) => sum + order.totalAmount,
          0
        ),
      },
      'Daily orders retrieved successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
});
