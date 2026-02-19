import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { logger } from '@/lib/logger';
import { normalizePaymentMethodForStorage } from '@/lib/utils/payment-methods';

const paymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive('Payment amount must be greater than zero'),
  paymentMethod: z
    .string()
    .min(1, 'Payment method is required')
    .transform(value => normalizePaymentMethodForStorage(value) || value),
  note: z.string().max(500, 'Note must be 500 characters or less').optional(),
  paymentDate: z.string().datetime().optional(),
});

const PAYMENT_TOLERANCE = 0.01;

function getTransactionIdFromPath(pathname: string): number | null {
  const segments = pathname.split('/');
  const salesIndex = segments.findIndex(segment => segment === 'sales');

  if (salesIndex === -1 || salesIndex + 1 >= segments.length) {
    return null;
  }

  const maybeId = parseInt(segments[salesIndex + 1], 10);
  return Number.isNaN(maybeId) ? null : maybeId;
}

export const POST = withAuth(async function (request: AuthenticatedRequest) {
  try {
    const transactionId = getTransactionIdFromPath(request.nextUrl.pathname);

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Invalid sales transaction ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedBody = paymentSchema.parse(body);

    const paymentDate = validatedBody.paymentDate
      ? new Date(validatedBody.paymentDate)
      : new Date();

    const result = await prisma.$transaction(async tx => {
      const transaction = (await tx.salesTransaction.findUnique({
        where: { id: transactionId },
        include: {
          split_payments: true,
          transaction_payments: true,
        } as any,
      })) as any;

      if (!transaction) {
        throw new Error('Sales transaction not found');
      }

      const splitPaidTotal = transaction.split_payments.reduce(
        (sum: number, payment: any) => {
          // Exclude debt from split payment total (debt is tracked separately in transaction_payments)
          if (payment.payment_method === 'debt') {
            return sum;
          }
          return sum + Number(payment.amount || 0);
        },
        0
      );
      const ledgerPaidTotal = transaction.transaction_payments.reduce(
        (sum: number, payment: any) => sum + Number(payment.amount || 0),
        0
      );
      const totalPaidBefore = splitPaidTotal + ledgerPaidTotal;
      const outstandingBefore = Math.max(
        0,
        Number(transaction.total_amount) - totalPaidBefore
      );

      if (validatedBody.amount - outstandingBefore > PAYMENT_TOLERANCE) {
        throw new Error('Payment amount exceeds outstanding balance');
      }

      const paymentRecord = await (tx as any).transactionPayment.create({
        data: {
          transaction_id: transactionId,
          amount: validatedBody.amount,
          payment_method: validatedBody.paymentMethod,
          note: validatedBody.note,
          payment_date: paymentDate,
          recorded_by: parseInt(request.user.id, 10),
        },
        include: {
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      const totalPaidAfter = totalPaidBefore + validatedBody.amount;
      const outstandingAfter = Math.max(
        0,
        Number(transaction.total_amount) - totalPaidAfter
      );

      const updatedStatus =
        outstandingAfter <= PAYMENT_TOLERANCE
          ? 'PAID'
          : totalPaidAfter > 0
            ? 'PARTIAL'
            : 'PENDING';

      const updatedTransaction = await tx.salesTransaction.update({
        where: { id: transactionId },
        data: {
          payment_status: updatedStatus,
        },
      });

      return {
        paymentRecord,
        outstandingAfter,
        totalPaidAfter,
        updatedTransaction,
      };
    });

    logger.info('Recorded additional payment for sale', {
      saleId: transactionId,
      paymentId: result.paymentRecord.id,
      userId: request.user.id,
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: result.paymentRecord.id,
        amount: Number(result.paymentRecord.amount),
        method: result.paymentRecord.payment_method,
        note: result.paymentRecord.note,
        paymentDate: result.paymentRecord.payment_date,
        recordedById: result.paymentRecord.recorded_by,
        recordedBy: result.paymentRecord.recordedBy
          ? {
              id: result.paymentRecord.recordedBy.id,
              firstName: result.paymentRecord.recordedBy.firstName,
              lastName: result.paymentRecord.recordedBy.lastName,
              email: result.paymentRecord.recordedBy.email,
            }
          : null,
        createdAt: result.paymentRecord.created_at,
      },
      paymentStatus: result.updatedTransaction.payment_status,
      amountPaid: Number(result.totalPaidAfter.toFixed(2)),
      balanceDue: Number(result.outstandingAfter.toFixed(2)),
    });
  } catch (error) {
    logger.error('Error recording sales payment', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors.map(item => ({
            field: item.path.join('.'),
            message: item.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Sales transaction not found') {
      return NextResponse.json(
        { error: 'Sales transaction not found' },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message === 'Payment amount exceeds outstanding balance'
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
});
