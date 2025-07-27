import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email';
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
  receiptData: z.object({
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
  }),
});

async function handleEmailReceipt(request: AuthenticatedRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = emailReceiptSchema.parse(body);

    const { customerEmail, saleId, customerName, receiptData } = validatedData;

    // Send email receipt
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
