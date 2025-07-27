import { NextResponse } from 'next/server';
import { withPOSAuth, AuthenticatedRequest } from '@/lib/api-auth-middleware';
import { createXprinterService, ReceiptData } from '@/lib/pos/thermal-printer';
import { z } from 'zod';
import { ERROR_MESSAGES, VALIDATION_RULES } from '@/lib/constants';

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
  printerConfig: z
    .object({
      type: z.enum(['usb', 'network', 'serial']),
      interface: z.string().min(1, 'Interface is required'),
      options: z
        .object({
          width: z.number().optional(),
          characterSet: z.string().optional(),
          removeSpecialCharacters: z.boolean().optional(),
          lineCharacter: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

async function handlePrintReceipt(request: AuthenticatedRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    // Debug logging removed for production
    const validatedData = printReceiptSchema.parse(body);

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
      printerConfig,
    } = validatedData;

    // Create receipt data
    const receiptData: ReceiptData = {
      saleId,
      timestamp: new Date(timestamp),
      staffName,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount,
      total,
      paymentMethod,
    };

    // Create printer service
    const printerService = createXprinterService(printerConfig);

    // Test printer connection first
    const isConnected = await printerService.testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Printer not connected. Please check USB connection.' },
        { status: 503 }
      );
    }

    // Print receipt
    const printSuccess = await printerService.printReceipt(receiptData);
    if (!printSuccess) {
      return NextResponse.json(
        { error: 'Failed to print receipt. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Receipt printed successfully',
      saleId,
    });
  } catch (error) {
    console.error('Error printing receipt:', error);

    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
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

// Test printer connection endpoint
async function handleTestPrinter(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { printerConfig } = body;

    const printerService = createXprinterService(printerConfig);

    // Test connection
    const isConnected = await printerService.testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Printer not connected' },
        { status: 503 }
      );
    }

    // Print test page
    const testSuccess = await printerService.printTestPage();
    if (!testSuccess) {
      return NextResponse.json(
        { error: 'Failed to print test page' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Printer test successful',
    });
  } catch (error) {
    console.error('Printer test error:', error);
    return NextResponse.json({ error: 'Printer test failed' }, { status: 500 });
  }
}

// Route handlers
export const POST = withPOSAuth(async (request: AuthenticatedRequest) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'test') {
    return handleTestPrinter(request);
  }

  return handlePrintReceipt(request);
});
