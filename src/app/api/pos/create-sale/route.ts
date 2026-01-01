import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { emailService } from '@/lib/email';
import { z } from 'zod';
import type { SplitPayment } from '@prisma/client';
import { logger } from '@/lib/logger';
import {
  normalizeNigerianPhone,
  getPhoneSearchPatterns,
} from '@/lib/utils/phone-utils';
import { formatPaymentMethodLabel } from '@/lib/utils/payment-methods';

// Validation schema for POS sale creation
const posSaleItemSchema = z.object({
  productId: z.coerce.number().int().positive('Product ID must be positive'),
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
  price: z.coerce.number().positive('Price must be positive'),
  total: z.coerce.number().positive('Total must be positive'),
  couponId: z.coerce.number().int().positive().optional(),
});

const transactionFeeSchema = z.object({
  feeType: z.string().min(1, 'Fee type is required'),
  description: z.string().optional(),
  amount: z.coerce.number().positive('Fee amount must be positive'),
});

const customerInfoSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('Nigeria'),
  customerType: z.enum(['individual', 'business']).default('individual'),
  notes: z.string().optional(),
});

const posSaleSchema = z
  .object({
    items: z.array(posSaleItemSchema).min(1, 'At least one item is required'),
    subtotal: z.coerce.number().positive('Subtotal must be positive'),
    discount: z.coerce.number().min(0, 'Discount cannot be negative'),
    fees: z.array(transactionFeeSchema).optional().default([]),
    total: z.coerce.number().positive('Total must be positive'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    customerInfo: customerInfoSchema.optional(),
    // Legacy fields for backward compatibility
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
      // Validate that total matches items total minus discount plus fees
      const itemsTotal = data.items.reduce((sum, item) => sum + item.total, 0);
      const feesTotal =
        data.fees?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const expectedTotal = itemsTotal - data.discount + feesTotal;

      // Also validate against subtotal-based calculation for compatibility
      const subtotalBasedTotal = data.subtotal - data.discount + feesTotal;

      // Allow for small rounding differences (1 cent)
      const tolerance = 0.01;
      const isValidItemsTotal =
        Math.abs(data.total - expectedTotal) < tolerance;
      const isValidSubtotalTotal =
        Math.abs(data.total - subtotalBasedTotal) < tolerance;

      if (!isValidItemsTotal && !isValidSubtotalTotal) {
        // Log detailed calculation info for debugging
        console.error('Total validation failed:', {
          subtotal: data.subtotal,
          discount: data.discount,
          feesTotal,
          expectedFromItems: expectedTotal,
          expectedFromSubtotal: subtotalBasedTotal,
          actualTotal: data.total,
          itemsCalculation: `${itemsTotal} - ${data.discount} + ${feesTotal} = ${expectedTotal}`,
          subtotalCalculation: `${data.subtotal} - ${data.discount} + ${feesTotal} = ${subtotalBasedTotal}`,
        });
      }

      return isValidItemsTotal || isValidSubtotalTotal;
    },
    {
      message: 'Total does not match items total minus discount plus fees',
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
  )
  .refine(
    data => {
      if (data.paymentMethod !== 'debt') {
        return true;
      }

      return data.amountPaid <= data.total + 0.01;
    },
    {
      message: 'Deposit cannot exceed total amount for debt payments',
      path: ['amountPaid'],
    }
  )
  .refine(
    data => {
      if (data.paymentMethod !== 'debt') {
        return true;
      }

      const info = data.customerInfo;
      const infoPhone = info?.phone ? info.phone.trim() : '';
      const infoEmail = info?.email ? info.email.trim() : '';
      const legacyPhone = data.customerPhone ? data.customerPhone.trim() : '';
      const legacyEmail = data.customerEmail ? data.customerEmail.trim() : '';

      return !!(infoPhone || infoEmail || legacyPhone || legacyEmail);
    },
    {
      message: 'Customer phone or email is required for debt payments',
      path: ['customerInfo'],
    }
  );

export const POST = withAuth(async function (request: AuthenticatedRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    logger.info('POS sale request received', {
      userId: request.user.id,
      itemCount: body.items?.length || 0,
      total: body.total,
      paymentMethod: body.paymentMethod,
    });

    const validatedData = posSaleSchema.parse(body);

    // Generate transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const isSplitPayment = validatedData.paymentMethod === 'split';
    const isDebtPayment = validatedData.paymentMethod === 'debt';
    const splitPaymentsInput = validatedData.splitPayments || [];
    const splitNonDebtTotal = isSplitPayment
      ? splitPaymentsInput
          .filter(payment => payment.method !== 'debt')
          .reduce((sum, payment) => sum + payment.amount, 0)
      : 0;
    const splitDebtTotal = isSplitPayment
      ? splitPaymentsInput
          .filter(payment => payment.method === 'debt')
          .reduce((sum, payment) => sum + payment.amount, 0)
      : 0;
    const totalCoverage = isSplitPayment
      ? splitNonDebtTotal + splitDebtTotal
      : validatedData.amountPaid;

    const tolerance = 0.01;
    if (
      isSplitPayment &&
      Math.abs(totalCoverage - validatedData.total) > tolerance
    ) {
      throw new Error('Split payments must cover the total amount');
    }

    const totalPaidAtCreation = isSplitPayment
      ? splitNonDebtTotal
      : validatedData.amountPaid;
    const outstandingAfterPayment = Math.max(
      0,
      Number((validatedData.total - totalPaidAtCreation).toFixed(2))
    );
    const initialPaymentStatus =
      outstandingAfterPayment <= tolerance
        ? 'PAID'
        : totalPaidAtCreation > 0
          ? 'PARTIAL'
          : 'PENDING';

    // Start database transaction
    const result = await prisma.$transaction(async tx => {
      // Handle customer information - create or find customer if enhanced info provided
      let customerId: number | null = null;
      let customerData = {
        name: validatedData.customerName || validatedData.customerInfo?.name,
        phone: validatedData.customerPhone || validatedData.customerInfo?.phone,
        email: validatedData.customerEmail || validatedData.customerInfo?.email,
      };

      // Debug logging for customer processing
      logger.info('Customer processing debug', {
        hasCustomerInfo: !!validatedData.customerInfo,
        customerInfo: validatedData.customerInfo,
        legacyFields: {
          name: validatedData.customerName,
          phone: validatedData.customerPhone,
          email: validatedData.customerEmail,
        },
      });

      if (
        validatedData.customerInfo &&
        (validatedData.customerInfo.email || validatedData.customerInfo.phone)
      ) {
        // Check if customer already exists
        let existingCustomer = null;

        if (validatedData.customerInfo.email) {
          existingCustomer = await (tx as any).customer.findUnique({
            where: { email: validatedData.customerInfo.email },
          });
        }

        if (!existingCustomer && validatedData.customerInfo.phone) {
          // Normalize phone number and search for all possible formats
          const phonePatterns = getPhoneSearchPatterns(
            validatedData.customerInfo.phone
          );

          existingCustomer = await (tx as any).customer.findFirst({
            where: {
              OR: phonePatterns.map(pattern => ({ phone: pattern })),
            },
          });
        }

        if (existingCustomer) {
          // Update existing customer with new information
          // Normalize phone number if provided
          const normalizedPhone = validatedData.customerInfo.phone
            ? normalizeNigerianPhone(validatedData.customerInfo.phone)
                .normalized
            : existingCustomer.phone;

          const updatedCustomer = await (tx as any).customer.update({
            where: { id: existingCustomer.id },
            data: {
              name: validatedData.customerInfo.name || existingCustomer.name,
              phone: normalizedPhone,
              billingAddress:
                validatedData.customerInfo.billingAddress ||
                existingCustomer.billingAddress,
              shippingAddress:
                validatedData.customerInfo.shippingAddress ||
                existingCustomer.shippingAddress,
              city: validatedData.customerInfo.city || existingCustomer.city,
              state: validatedData.customerInfo.state || existingCustomer.state,
              postalCode:
                validatedData.customerInfo.postalCode ||
                existingCustomer.postalCode,
              country:
                validatedData.customerInfo.country || existingCustomer.country,
              customerType:
                validatedData.customerInfo.customerType ||
                existingCustomer.customerType,
              notes: validatedData.customerInfo.notes || existingCustomer.notes,
              updatedAt: new Date(),
            },
          });
          customerId = updatedCustomer.id;
          customerData = {
            name: updatedCustomer.name || undefined,
            phone: updatedCustomer.phone || undefined,
            email: updatedCustomer.email || undefined,
          };

          logger.info('Updated existing customer', {
            customerId: updatedCustomer.id,
            customerName: updatedCustomer.name,
            customerEmail: updatedCustomer.email,
          });
        } else {
          // Create new customer
          // Normalize phone number before storing
          const normalizedPhone = validatedData.customerInfo.phone
            ? normalizeNigerianPhone(validatedData.customerInfo.phone)
                .normalized
            : null;

          const newCustomer = await (tx as any).customer.create({
            data: {
              name: validatedData.customerInfo.name,
              email: validatedData.customerInfo.email,
              phone: normalizedPhone,
              billingAddress: validatedData.customerInfo.billingAddress,
              shippingAddress: validatedData.customerInfo.shippingAddress,
              city: validatedData.customerInfo.city,
              state: validatedData.customerInfo.state,
              postalCode: validatedData.customerInfo.postalCode,
              country: validatedData.customerInfo.country,
              customerType: validatedData.customerInfo.customerType,
              notes: validatedData.customerInfo.notes,
            },
          });
          customerId = newCustomer.id;
          customerData = {
            name: newCustomer.name || undefined,
            phone: newCustomer.phone || undefined,
            email: newCustomer.email || undefined,
          };

          logger.info('Created new customer', {
            customerId: newCustomer.id,
            customerName: newCustomer.name,
            customerEmail: newCustomer.email,
          });
        }
      }

      // Log customer processing result
      logger.info('Customer processing result', {
        customerId,
        customerData,
        willCreateTransaction: true,
      });

      // Validate stock availability for all items BEFORE creating transaction
      for (const item of validatedData.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { name: true, stock: true, isService: true },
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        // Check stock availability (skip for services)
        if (!product.isService && product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }
      }

      // Create sales transaction
      const salesTransaction = await tx.salesTransaction.create({
        data: {
          subtotal: validatedData.subtotal,
          discount_amount: validatedData.discount,
          total_amount: validatedData.total,
          payment_method: validatedData.paymentMethod,
          payment_status: initialPaymentStatus,
          transaction_number: transactionNumber,
          transaction_type: 'sale',
          ...(customerId && { customer_id: customerId }),
          notes: validatedData.notes,
          user_id: parseInt(request.user.id),
        },
      });

      // Create sales items and update product stock
      const salesItems = await Promise.all(
        validatedData.items.map(async item => {
          // Get product details for stock update
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true, isService: true, stock: true },
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

          // Update product stock and log transaction (skip for services)
          if (!product?.isService) {
            const previousStock = product?.stock || 0;
            const newStock = previousStock - item.quantity;

            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });

            // Log stock transaction
            await tx.stockTransaction.create({
              data: {
                productId: item.productId,
                quantity: -item.quantity, // Negative for sales
                type: 'SALE',
                referenceType: 'SalesTransaction',
                referenceId: salesTransaction.id,
                reason: `Sale: ${salesTransaction.transaction_number}`,
                userId: parseInt(request.user.id),
                previousStock,
                newStock,
              },
            });
          }

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
      if (isSplitPayment && validatedData.splitPayments) {
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

      // Record initial debt deposit if provided
      type TransactionPaymentRecord = {
        id: number;
        amount: unknown;
        payment_method: string;
        note: string | null;
        payment_date: Date | null;
        recorded_by: number | null;
        created_at: Date | null;
        recordedBy: {
          id: number;
          firstName: string;
          lastName: string;
          email: string;
        } | null;
      };

      let transactionPayments: TransactionPaymentRecord[] = [];
      if (isDebtPayment && totalPaidAtCreation > 0) {
        const paymentRecord = await (tx as any).transactionPayment.create({
          data: {
            transaction_id: salesTransaction.id,
            amount: totalPaidAtCreation,
            payment_method: 'DEBT',
            note: validatedData.notes,
            payment_date: new Date(),
            recorded_by: parseInt(request.user.id),
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

        transactionPayments = [paymentRecord];
      }

      // Create transaction fees if any
      const transactionFees = await Promise.all(
        (validatedData.fees || []).map(async (fee: any) => {
          return await (tx as any).transactionFee.create({
            data: {
              transactionId: salesTransaction.id,
              feeType: fee.feeType,
              description: fee.description,
              amount: fee.amount,
            },
          });
        })
      );

      return {
        salesTransaction,
        salesItems,
        splitPayments,
        transactionFees,
        transactionPayments,
      };
    });

    // Send email receipt if customer email is provided
    let emailSent = false;
    const customerEmail =
      validatedData.customerEmail || validatedData.customerInfo?.email;
    if (customerEmail) {
      const totalSplitPaid =
        result.splitPayments?.reduce((sum, payment) => {
          if (payment.payment_method === 'debt') {
            return sum;
          }
          return sum + Number(payment.amount);
        }, 0) || 0;
      const totalLedgerPaid =
        result.transactionPayments?.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0
        ) || 0;
      const totalPaid = totalSplitPaid + totalLedgerPaid;
      const balanceDue = Math.max(
        0,
        Number((validatedData.total - totalPaid).toFixed(2))
      );
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
        const customerName =
          validatedData.customerName ||
          validatedData.customerInfo?.name ||
          'Customer';
        const emailData = {
          to: customerEmail,
          customerName,
          saleId: result.salesTransaction.id.toString(),
          items: result.salesItems.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            price: Number(item.unit_price),
            total: Number(item.total_price),
          })),
          subtotal: validatedData.subtotal,
          discount: validatedData.discount,
          fees:
            result.transactionFees?.map(fee => ({
              type: fee.feeType,
              description: fee.description || undefined,
              amount: Number(fee.amount),
            })) || [],
          total: validatedData.total,
          paymentMethod: formatPaymentMethodLabel(validatedData.paymentMethod),
          splitPayments:
            result.splitPayments?.map(payment => ({
              method: payment.payment_method,
              amount: Number(payment.amount),
            })) || [],
          timestamp: new Date(),
          staffName,
          notes: validatedData.notes,
          amountPaid: Number(totalPaid.toFixed(2)),
          balanceDue,
          transactionPayments:
            result.transactionPayments?.map(payment => ({
              amount: Number(payment.amount),
              method: payment.payment_method,
              note: payment.note,
              paymentDate: payment.payment_date,
            })) || [],
        };

        // Send email receipt
        emailSent = await emailService.sendReceiptEmail(emailData);

        if (emailSent) {
          logger.info('Email receipt sent successfully', {
            customerEmail,
            saleId: result.salesTransaction.id,
            userId: request.user.id,
          });
        } else {
          logger.warn('Failed to send email receipt', {
            customerEmail,
            saleId: result.salesTransaction.id,
            userId: request.user.id,
          });
        }
      } catch (emailError) {
        // Don't fail the transaction if email fails
        logger.error('Error sending email receipt', {
          error:
            emailError instanceof Error
              ? emailError.message
              : String(emailError),
          customerEmail,
          saleId: result.salesTransaction.id,
          userId: request.user.id,
        });
      }
    }

    const totalSplitPaid = result.splitPayments?.reduce((sum, payment) => {
      if (payment.payment_method === 'debt') {
        return sum;
      }
      return sum + Number(payment.amount);
    }, 0) || 0;
    const totalLedgerPaid = result.transactionPayments?.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    ) || 0;
    const totalPaid = totalSplitPaid + totalLedgerPaid;
    const balanceDue = Math.max(
      0,
      Number((validatedData.total - totalPaid).toFixed(2))
    );

    // Return success response
    return NextResponse.json({
      success: true,
      saleId: result.salesTransaction.id,
      transactionNumber: result.salesTransaction.transaction_number,
      message: 'Sale created successfully',
      emailSent,
      paymentStatus: initialPaymentStatus,
      amountPaid: Number(totalPaid.toFixed(2)),
      balanceDue,
      transactionPayments:
        result.transactionPayments?.map(payment => ({
          id: payment.id,
          amount: Number(payment.amount),
          method: payment.payment_method,
          note: payment.note,
          paymentDate: payment.payment_date,
          recordedById: payment.recorded_by,
          recordedBy: payment.recordedBy
            ? {
                id: payment.recordedBy.id,
                firstName: payment.recordedBy.firstName,
                lastName: payment.recordedBy.lastName,
                email: payment.recordedBy.email,
              }
            : null,
          createdAt: payment.created_at,
        })) || [],
    });
  } catch (error) {
    logger.error('POS create sale error', {
      error: error instanceof Error ? error.message : String(error),
      userId: request.user?.id,
      stack: error instanceof Error ? error.stack : undefined,
    });

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
