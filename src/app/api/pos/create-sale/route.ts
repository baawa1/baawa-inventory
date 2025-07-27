import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { z } from 'zod';

// Validation schema for POS sale creation
const posSaleItemSchema = z.object({
  productId: z.coerce.number().int().positive('Product ID must be positive'),
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
  price: z.coerce.number().positive('Price must be positive'),
  total: z.coerce.number().positive('Total must be positive'),
});

const posSaleSchema = z
  .object({
    items: z.array(posSaleItemSchema).min(1, 'At least one item is required'),
    subtotal: z.coerce.number().positive('Subtotal must be positive'),
    discount: z.coerce.number().min(0, 'Discount cannot be negative'),
    total: z.coerce.number().positive('Total must be positive'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    customerEmail: z.string().email('Invalid email format').optional(),
    amountPaid: z.coerce.number().min(0, 'Amount paid cannot be negative'),
    notes: z.string().optional(),
    splitPayments: z
      .array(
        z.object({
          id: z.string(),
          amount: z.coerce.number().positive(),
          method: z.string(),
        })
      )
      .optional(),
  })
  .refine(
    data => {
      // Validate that total matches items total minus discount
      const itemsTotal = data.items.reduce((sum, item) => sum + item.total, 0);
      const expectedTotal = itemsTotal - data.discount;
      return Math.abs(data.total - expectedTotal) < 0.01; // Allow for small rounding differences
    },
    {
      message: 'Total does not match items total minus discount',
      path: ['total'],
    }
  )
  .refine(
    data => {
      // For split payments, validate that split payments have valid amounts
      if (data.paymentMethod === 'split' && data.splitPayments) {
        return data.splitPayments.every(payment => payment.amount > 0);
      }
      return true;
    },
    {
      message: 'Split payments must have positive amounts',
      path: ['splitPayments'],
    }
  );

export const POST = withAuth(async function (request: AuthenticatedRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    console.log('Received sale data:', body);

    const validatedData = posSaleSchema.parse(body);

    // Generate transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Start database transaction
    const result = await prisma.$transaction(async tx => {
      // Create sales transaction
      const salesTransaction = await tx.salesTransaction.create({
        data: {
          subtotal: validatedData.subtotal,
          discount_amount: validatedData.discount,
          total_amount: validatedData.total,
          payment_method: validatedData.paymentMethod,
          payment_status: 'PAID', // POS sales are typically paid immediately
          transaction_number: transactionNumber,
          transaction_type: 'sale',
          customer_name: validatedData.customerName,
          customer_phone: validatedData.customerPhone,
          customer_email: validatedData.customerEmail,
          notes: validatedData.notes,
          user_id: parseInt(request.user.id),
        },
      });

      // Create sales items and update product stock
      const salesItems = await Promise.all(
        validatedData.items.map(async item => {
          // Create sales item
          const salesItem = await tx.salesItem.create({
            data: {
              quantity: item.quantity,
              unit_price: item.price,
              total_price: item.total,
              discount_amount: 0, // Item-level discounts handled at transaction level
              transaction_id: salesTransaction.id,
              product_id: item.productId,
            },
          });

          // Update product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          return salesItem;
        })
      );

      return {
        salesTransaction,
        salesItems,
      };
    });

    // Return success response
    return NextResponse.json({
      success: true,
      saleId: result.salesTransaction.id,
      transactionNumber: result.salesTransaction.transaction_number,
      message: 'Sale created successfully',
    });
  } catch (error) {
    console.error('POS create sale error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Transaction number already exists' },
          { status: 409 }
        );
      }

      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Product not found or insufficient stock' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
});
