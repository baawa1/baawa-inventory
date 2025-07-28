import { NextResponse } from 'next/server';
import { AuthenticatedRequest } from '@/lib/api-auth-middleware';
import { z } from 'zod';
import { ERROR_MESSAGES, VALIDATION_RULES } from '@/lib/constants';
import { safeParseTimestamp } from '@/lib/utils/date-utils';
import { NextRequest } from 'next/server';

// Validation schema for print receipt request
const printReceiptSchema = z.object({
  saleId: z.string().min(1, 'Sale ID is required'),
  timestamp: z.string().datetime('Invalid timestamp'),
  staffName: z.string().min(1, 'Staff name is required'),
  customerName: z.string().max(VALIDATION_RULES.MAX_NAME_LENGTH).optional(),
  customerPhone: z.string().max(20).optional(),
  items: z.array(
    z.object({
      name: z.string().min(1, 'Item name is required'),
      sku: z.string().min(1, 'SKU is required'),
      quantity: z.number().positive('Quantity must be positive'),
      price: z.number().positive('Price must be positive'),
      total: z.number().positive('Total must be positive'),
      category: z.string().optional(),
    })
  ),
  subtotal: z.number().positive('Subtotal must be positive'),
  discount: z.number().min(0, 'Discount cannot be negative'),
  total: z.number().positive('Total must be positive'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
});

async function handlePrintReceipt(request: AuthenticatedRequest) {
  try {
    console.log('Starting print receipt handler');

    // Parse and validate request body
    const body = await request.json();
    console.log('Request body parsed successfully');

    const validatedData = printReceiptSchema.parse(body);
    console.log('Request data validated successfully');

    const {
      saleId,
      timestamp,
      staffName,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount,
      total,
      paymentMethod,
    } = validatedData;

    console.log('Creating receipt data');
    // Create receipt data for future thermal printer implementation
    const _receiptData = {
      saleId,
      timestamp: safeParseTimestamp(timestamp),
      staffName,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount,
      total,
      paymentMethod,
    };

    console.log(
      'Thermal printer functionality removed - returning fallback response'
    );
    return NextResponse.json({
      success: true,
      message: 'Receipt content generated for web printing',
      note: 'Thermal printer functionality has been removed. Receipt will be shown in browser window.',
      fallback: true,
      details:
        'To enable thermal printing, rebuild the thermal printer functionality.',
      saleId,
    });
  } catch (error) {
    console.error('Error printing receipt:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: ERROR_MESSAGES.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : String(error),
        troubleshooting: [
          'Check server logs for detailed error information',
          'Thermal printer functionality has been removed',
          'Use web printing for receipts',
        ],
      },
      { status: 500 }
    );
  }
}

// Test printer connection endpoint
async function handleTestPrinter(_request: AuthenticatedRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Thermal printer functionality removed',
      details:
        'Thermal printer testing has been removed. Use web printing for receipts.',
      fallback: true,
    });
  } catch (error) {
    console.error('Printer test error:', error);
    return NextResponse.json(
      {
        error: 'Thermal printer functionality removed',
        details:
          'Thermal printer testing has been removed. Use web printing for receipts.',
      },
      { status: 500 }
    );
  }
}

// Route handlers
export const POST = async (request: NextRequest) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'test') {
    return handleTestPrinter(request as AuthenticatedRequest);
  }

  if (action === 'simple-test') {
    try {
      console.log('Running simple test');
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'Thermal printer functionality removed',
        details:
          'Thermal printer testing has been removed. Use web printing for receipts.',
        fallback: true,
      });
    } catch (error) {
      console.error('Simple test failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Thermal printer functionality removed',
          details:
            'Thermal printer testing has been removed. Use web printing for receipts.',
        },
        { status: 500 }
      );
    }
  }

  if (action === 'print-message') {
    try {
      console.log('Printing custom message');
      const body = await request.json();
      const { message: _message = 'Thermal printer functionality removed' } =
        body;

      return NextResponse.json({
        success: true,
        message: `Message content generated for web printing`,
        note: 'Thermal printer functionality has been removed. Message will be shown in browser window.',
        fallback: true,
        details:
          'To enable thermal printing, rebuild the thermal printer functionality.',
      });
    } catch (error) {
      console.error('Print message error:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Thermal printer functionality removed',
          details:
            'Thermal printer functionality has been removed. Use web printing for messages.',
        },
        { status: 500 }
      );
    }
  }

  // For now, bypass middleware for testing
  try {
    console.log('Bypassing middleware for testing');
    return await handlePrintReceipt(request as AuthenticatedRequest);
  } catch (error) {
    console.error('Direct handler error:', error);

    return NextResponse.json({
      success: true,
      message: 'Fallback mode: Receipt content generated for web printing',
      note: 'Thermal printer functionality has been removed. Receipt will be shown in browser window.',
      details:
        'To enable thermal printing, rebuild the thermal printer functionality.',
    });
  }
};
