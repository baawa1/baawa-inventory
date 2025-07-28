import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { withPOSAuth, AuthenticatedRequest } from '@/lib/api-auth-middleware';
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES,
} from '@/lib/constants';

// Validation schema for email receipt
const emailReceiptSchema = z.object({
  customerEmail: z
    .string()
    .email('Invalid email address')
    .max(VALIDATION_RULES.MAX_EMAIL_LENGTH),
  saleId: z.string().min(1, 'Sale ID is required'),
  customerName: z.string().max(VALIDATION_RULES.MAX_NAME_LENGTH).optional(),
  // Optional receiptData for backward compatibility
  receiptData: z
    .object({
      items: z.array(
        z.object({
          name: z.string(),
          quantity: z.number(),
          price: z.number(),
          total: z.number(),
        })
      ),
      subtotal: z.number(),
      discount: z.number(),
      total: z.number(),
      paymentMethod: z.string(),
      timestamp: z.string(),
      staffName: z.string(),
    })
    .optional(),
});

async function handleEmailReceipt(request: AuthenticatedRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = emailReceiptSchema.parse(body);

    const { customerEmail, saleId, customerName } = validatedData;

    // If receiptData is provided, use it directly
    if (validatedData.receiptData) {
      const { receiptData } = validatedData;

      const emailSent = await emailService.sendReceiptEmail({
        to: customerEmail,
        customerName: customerName || 'Customer',
        saleId,
        items: receiptData.items,
        subtotal: receiptData.subtotal,
        discount: receiptData.discount,
        total: receiptData.total,
        paymentMethod: receiptData.paymentMethod,
        timestamp: new Date(receiptData.timestamp),
        staffName: receiptData.staffName,
      });

      if (!emailSent) {
        return NextResponse.json(
          { error: 'Failed to send email receipt' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: SUCCESS_MESSAGES.EMAIL_SENT,
        saleId,
        customerEmail,
      });
    }

    // Otherwise, fetch complete transaction data from database
    const transaction = await prisma.salesTransaction.findUnique({
      where: { id: parseInt(saleId) },
      include: {
        sales_items: {
          include: {
            products: {
              select: { name: true },
            },
          },
        },
        users: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Get staff name
    const staffName = transaction.users
      ? `${transaction.users.firstName} ${transaction.users.lastName}`.trim()
      : 'Staff Member';

    // Prepare email data
    const emailData = {
      to: customerEmail,
      customerName: customerName || transaction.customer_name || 'Customer',
      saleId: transaction.id.toString(),
      items: transaction.sales_items.map(item => ({
        name: item.products?.name || 'Unknown Product',
        quantity: item.quantity,
        price: Number(item.unit_price),
        total: Number(item.total_price),
      })),
      subtotal: Number(transaction.subtotal),
      discount: Number(transaction.discount_amount),
      total: Number(transaction.total_amount),
      paymentMethod: transaction.payment_method,
      timestamp: transaction.created_at || new Date(),
      staffName,
    };

    // Send email receipt
    const emailSent = await emailService.sendReceiptEmail(emailData);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email receipt' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: SUCCESS_MESSAGES.EMAIL_SENT,
      saleId,
      customerEmail,
    });
  } catch (error) {
    console.error('Error sending email receipt:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: 500 }
    );
  }
}

export const POST = withPOSAuth(handleEmailReceipt);
