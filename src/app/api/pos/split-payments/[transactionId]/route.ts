import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';

export const GET = withAuth(async function (request: AuthenticatedRequest) {
  try {
    const transactionId = request.nextUrl.pathname.split('/').pop();

    if (!transactionId || isNaN(parseInt(transactionId))) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      );
    }

    const splitPayments = await prisma.splitPayment.findMany({
      where: {
        transaction_id: parseInt(transactionId),
      },
      select: {
        id: true,
        amount: true,
        payment_method: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      splitPayments: splitPayments.map(payment => ({
        id: payment.id,
        amount: Number(payment.amount),
        method: payment.payment_method,
        createdAt: payment.created_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching split payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch split payments' },
      { status: 500 }
    );
  }
});
