import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { emailService } from '@/lib/email';
import { z } from 'zod';
import type { SplitPayment } from '@prisma/client';

// Validation schema for POS sale creation
const posSaleItemSchema = z.object({
  productId: z.coerce.number().int().positive('Product ID must be positive'),
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
  price: z.coerce.number().positive('Price must be positive'),
  total: z.coerce.number().positive('Total must be positive'),
  couponId: z.coerce.number().int().positive().optional(),
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
      // Validate that discount doesn't exceed subtotal
      const itemsTotal = data.items.reduce((sum, item) => sum + item.total, 0);
      return data.discount <= itemsTotal;
    },
    {
      message: 'Discount cannot exceed subtotal',
      path: ['discount'],
    }
  )
  .refine(
    data => {
      // Validate that total is not negative
      return data.total >= 0;
    },
    {
      message: 'Total cannot be negative',
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
          // Get product details for email receipt
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true },
          });

          // Create sales item
          const salesItem = await tx.salesItem.create({
            data: {
              quantity: item.quantity,
              unit_price: item.price,
              total_price: item.total,
              discount_amount: 0, // Item-level discounts handled at transaction level
              transaction_id: salesTransaction.id,
              product_id: item.productId,
              coupon_id: item.couponId,
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

          return {
            ...salesItem,
            productName: product?.name || 'Unknown Product',
          };
        })
      );

      // Increment coupon usage only once if any item has a coupon
      const hasCoupon = validatedData.items.some(item => item.couponId);
      if (hasCoupon) {
        const couponId = validatedData.items.find(
          item => item.couponId
        )?.couponId;
        if (couponId) {
          await tx.coupon.update({
            where: { id: couponId },
            data: {
              currentUses: {
                increment: 1,
              },
            },
          });
        }
      }

      // Create split payments if this is a split payment transaction
      let splitPayments: SplitPayment[] = [];
      if (
        validatedData.paymentMethod === 'split' &&
        validatedData.splitPayments
      ) {
        splitPayments = await Promise.all(
          validatedData.splitPayments.map(async payment => {
            return await tx.splitPayment.create({
              data: {
                amount: payment.amount,
                payment_method: payment.method,
                transaction_id: salesTransaction.id,
              },
            });
          })
        );
      }

      return {
        salesTransaction,
        salesItems,
        splitPayments,
      };
    });

    // Send email receipt if customer email is provided
    let emailSent = false;
    if (validatedData.customerEmail) {
      try {
        // Get staff user details for email
        const staffUser = await prisma.user.findUnique({
          where: { id: parseInt(request.user.id) },
          select: { firstName: true, lastName: true },
        });

        const staffName = staffUser
          ? `${staffUser.firstName} ${staffUser.lastName}`.trim()
          : 'Staff Member';

        // Prepare email data
        const emailData = {
          to: validatedData.customerEmail,
          customerName: validatedData.customerName || 'Customer',
          saleId: result.salesTransaction.id.toString(),
          items: result.salesItems.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            price: Number(item.unit_price),
            total: Number(item.total_price),
          })),
          subtotal: validatedData.subtotal,
          discount: validatedData.discount,
          total: validatedData.total,
          paymentMethod: validatedData.paymentMethod,
          splitPayments:
            result.splitPayments?.map(payment => ({
              method: payment.payment_method,
              amount: Number(payment.amount),
            })) || [],
          timestamp: new Date(),
          staffName,
        };

        // Send email receipt
        emailSent = await emailService.sendReceiptEmail(emailData);

        if (emailSent) {
          console.log(
            'Email receipt sent successfully to:',
            validatedData.customerEmail
          );
        } else {
          console.error(
            'Failed to send email receipt to:',
            validatedData.customerEmail
          );
        }
      } catch (emailError) {
        // Don't fail the transaction if email fails
        console.error('Error sending email receipt:', emailError);
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      saleId: result.salesTransaction.id,
      transactionNumber: result.salesTransaction.transaction_number,
      message: 'Sale created successfully',
      emailSent,
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
