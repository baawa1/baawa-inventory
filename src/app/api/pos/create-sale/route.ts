import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withPOSAuth, AuthenticatedRequest } from '@/lib/api-auth-middleware';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  normalizeNigerianPhone,
  getPhoneSearchPatterns,
} from '@/lib/utils/phone-utils';
import {
  formatPaymentMethodLabel,
  normalizePaymentMethodForStorage,
} from '@/lib/utils/payment-methods';

// Validation schema for POS sale creation
const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeOptionalField = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return normalizeOptionalString(value);
  }
  return undefined;
};

const normalizeSalePayload = (body: any) => {
  const customerInfo = body?.customerInfo
    ? {
        ...body.customerInfo,
        name: normalizeOptionalString(body.customerInfo.name),
        email: normalizeOptionalField(body.customerInfo.email),
        phone: normalizeOptionalField(body.customerInfo.phone),
        billingAddress: normalizeOptionalString(body.customerInfo.billingAddress),
        shippingAddress: normalizeOptionalString(
          body.customerInfo.shippingAddress
        ),
        city: normalizeOptionalString(body.customerInfo.city),
        state: normalizeOptionalString(body.customerInfo.state),
        postalCode: normalizeOptionalString(body.customerInfo.postalCode),
        country: normalizeOptionalString(body.customerInfo.country),
        notes: normalizeOptionalString(body.customerInfo.notes),
        shippingCity: normalizeOptionalString(body.customerInfo.shippingCity),
        shippingState: normalizeOptionalString(
          body.customerInfo.shippingState
        ),
        shippingPostalCode: normalizeOptionalString(
          body.customerInfo.shippingPostalCode
        ),
        shippingCountry: normalizeOptionalString(
          body.customerInfo.shippingCountry
        ),
      }
    : undefined;

  return {
    ...body,
    customerInfo,
    customerName: normalizeOptionalString(body?.customerName),
    customerEmail: normalizeOptionalField(body?.customerEmail),
    customerPhone: normalizeOptionalField(body?.customerPhone),
  };
};
const posSaleItemSchema = z.object({
  productId: z.coerce.number().int().positive('Product ID must be positive'),
  quantity: z.coerce.number().int().positive('Quantity must be positive'),
  price: z.coerce.number().positive('Price must be positive'),
  total: z.coerce.number().positive('Total must be positive'),
  couponId: z.coerce.number().int().positive().optional(),
  basePrice: z.coerce.number().positive().optional(),
  priceOverride: z.coerce.number().positive().optional(),
  overrideReason: z.string().optional(),
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
  useBillingAsShipping: z.boolean().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),
});

const posSaleSchema = z
  .object({
    items: z.array(posSaleItemSchema).min(1, 'At least one item is required'),
    subtotal: z.coerce.number().positive('Subtotal must be positive'),
    discount: z.coerce.number().min(0, 'Discount cannot be negative'),
    fees: z.array(transactionFeeSchema).optional().default([]),
    total: z.coerce.number().min(0, 'Total cannot be negative'),
    paymentMethod: z
      .string()
      .min(1, 'Payment method is required')
      .transform(value => normalizePaymentMethodForStorage(value) || value),
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
          method: z
            .string()
            .transform(value => normalizePaymentMethodForStorage(value) || value),
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

const requireCustomerPhone = (data: z.infer<typeof posSaleSchema>) => {
  const infoPhone = data.customerInfo?.phone?.trim() || '';
  const legacyPhone = data.customerPhone?.trim() || '';
  return Boolean(infoPhone || legacyPhone);
};

export const POST = withPOSAuth(async function (request: AuthenticatedRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const normalizedBody = normalizeSalePayload(body);
    logger.info('POS sale request received', {
      userId: request.user.id,
      itemCount: normalizedBody.items?.length || 0,
      total: normalizedBody.total,
      paymentMethod: normalizedBody.paymentMethod,
    });

    const validatedData = posSaleSchema
      .refine(requireCustomerPhone, {
        message: 'Customer phone is required for checkout',
        path: ['customerInfo', 'phone'],
      })
      .parse(normalizedBody);

    // Generate transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const normalizedPaymentMethod =
      normalizePaymentMethodForStorage(validatedData.paymentMethod) ||
      validatedData.paymentMethod;
    const isSplitPayment = normalizedPaymentMethod === 'split';
    const isDebtPayment = normalizedPaymentMethod === 'debt';
    const splitPaymentsInput = (validatedData.splitPayments || []).map(
      payment => ({
        ...payment,
        method:
          normalizePaymentMethodForStorage(payment.method) || payment.method,
      })
    );
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
            ? (() => {
                const normalized = normalizeNigerianPhone(
                  validatedData.customerInfo.phone
                );
                return normalized.isValid
                  ? normalized.normalized
                  : validatedData.customerInfo.phone.trim();
              })()
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
            ? (() => {
                const normalized = normalizeNigerianPhone(
                  validatedData.customerInfo.phone
                );
                return normalized.isValid
                  ? normalized.normalized
                  : validatedData.customerInfo.phone.trim();
              })()
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

      const itemsByProductId = new Map<number, { quantity: number }>();
      validatedData.items.forEach(item => {
        const current = itemsByProductId.get(item.productId);
        if (current) {
          current.quantity += item.quantity;
        } else {
          itemsByProductId.set(item.productId, { quantity: item.quantity });
        }
      });

      const productIds = Array.from(itemsByProductId.keys());
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, stock: true, isService: true },
      });
      const productMap = new Map(products.map(product => [product.id, product]));

      // Validate stock availability for all items BEFORE creating transaction
      for (const [productId, productData] of itemsByProductId.entries()) {
        const product = productMap.get(productId);
        if (!product) {
          throw new Error(`Product with ID ${productId} not found`);
        }

        // Check stock availability (skip for services)
        if (!product.isService && product.stock < productData.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${productData.quantity}`
          );
        }
      }

      // Create sales transaction
      const salesTransaction = await tx.salesTransaction.create({
        data: {
          subtotal: validatedData.subtotal,
          discount_amount: validatedData.discount,
          total_amount: validatedData.total,
          payment_method: normalizedPaymentMethod,
          payment_status: initialPaymentStatus,
          transaction_number: transactionNumber,
          transaction_type: 'sale',
          ...(customerId && { customer_id: customerId }),
          notes: validatedData.notes,
          user_id: parseInt(request.user.id),
        },
      });

      await tx.salesItem.createMany({
        data: validatedData.items.map(item => ({
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.total,
          discount_amount: 0, // Item-level discounts handled at transaction level
          transaction_id: salesTransaction.id,
          product_id: item.productId,
          coupon_id: item.couponId ?? null,
        })),
      });

      const stockUpdates: Array<Promise<unknown>> = [];
      const stockTransactions: Array<{
        productId: number;
        quantity: number;
        type: 'SALE';
        referenceType: string;
        referenceId: number;
        reason: string;
        userId: number;
        previousStock: number;
        newStock: number;
      }> = [];

      itemsByProductId.forEach((itemData, productId) => {
        const product = productMap.get(productId);
        if (!product || product.isService) {
          return;
        }

        const previousStock = product.stock ?? 0;
        const newStock = previousStock - itemData.quantity;

        stockUpdates.push(
          tx.product.update({
            where: { id: productId },
            data: {
              stock: {
                decrement: itemData.quantity,
              },
            },
          })
        );

        stockTransactions.push({
          productId,
          quantity: -itemData.quantity, // Negative for sales
          type: 'SALE',
          referenceType: 'SalesTransaction',
          referenceId: salesTransaction.id,
          reason: `Sale: ${salesTransaction.transaction_number}`,
          userId: parseInt(request.user.id),
          previousStock,
          newStock,
        });
      });

      if (stockUpdates.length > 0) {
        await Promise.all(stockUpdates);
      }

      if (stockTransactions.length > 0) {
        await tx.stockTransaction.createMany({
          data: stockTransactions,
        });
      }

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
      if (isSplitPayment && splitPaymentsInput.length > 0) {
        await tx.splitPayment.createMany({
          data: splitPaymentsInput.map(payment => ({
            amount: payment.amount,
            payment_method: payment.method,
            transaction_id: salesTransaction.id,
          })),
        });
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
            payment_method: 'debt',
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

      if (!isSplitPayment && !isDebtPayment) {
        const paymentRecord = await (tx as any).transactionPayment.create({
          data: {
            transaction_id: salesTransaction.id,
            amount: validatedData.total,
            payment_method: normalizedPaymentMethod,
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
      if (validatedData.fees && validatedData.fees.length > 0) {
        await (tx as any).transactionFee.createMany({
          data: validatedData.fees.map((fee: any) => ({
            transactionId: salesTransaction.id,
            feeType: fee.feeType,
            description: fee.description,
            amount: fee.amount,
          })),
        });
      }

      return {
        salesTransaction,
        transactionPayments,
      };
    });

    // Automatic email receipts disabled; manual sending only.
    const emailSent = false;

    const totalSplitPaid = isSplitPayment
      ? splitPaymentsInput.reduce((sum, payment) => {
          if (payment.method === 'debt') {
            return sum;
          }
          return sum + Number(payment.amount);
        }, 0)
      : 0;
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
