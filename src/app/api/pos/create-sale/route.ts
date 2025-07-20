import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { withPOSAuth, AuthenticatedRequest } from "@/lib/api-auth-middleware";
import {
  PAYMENT_METHODS,
  ALL_PAYMENT_METHODS,
  TRANSACTION_PREFIXES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES,
} from "@/lib/constants";

// Validation schema for creating a sale
const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().positive(),
        quantity: z.number().min(VALIDATION_RULES.MIN_QUANTITY),
        price: z
          .number()
          .min(VALIDATION_RULES.MIN_PRICE)
          .max(VALIDATION_RULES.MAX_PRICE),
        total: z.number().positive(),
      })
    )
    .min(1, "At least one item is required"),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  total: z.number().positive(),
  paymentMethod: z.enum(ALL_PAYMENT_METHODS as [string, ...string[]]),
  customerName: z.string().max(VALIDATION_RULES.MAX_NAME_LENGTH).optional(),
  customerPhone: z.string().max(VALIDATION_RULES.MAX_PHONE_LENGTH).optional(),
  customerEmail: z
    .string()
    .email()
    .max(VALIDATION_RULES.MAX_EMAIL_LENGTH)
    .optional()
    .or(z.literal("")),
  amountPaid: z.number().positive().optional(),
  notes: z.string().max(VALIDATION_RULES.MAX_DESCRIPTION_LENGTH).optional(),
});

async function handleCreateSale(request: AuthenticatedRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createSaleSchema.parse(body);

    const {
      items,
      subtotal,
      discount,
      total,
      paymentMethod,
      customerName,
      customerPhone,
      customerEmail,
      amountPaid,
      notes,
    } = validatedData;

    // Validate payment amount for cash transactions
    if (
      paymentMethod === PAYMENT_METHODS.CASH &&
      amountPaid &&
      amountPaid < total
    ) {
      return NextResponse.json(
        { error: "Insufficient payment amount" },
        { status: 400 }
      );
    }

    // Create sale transaction in database with proper stock validation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate stock availability and lock products for update
      const productIds = items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          status: "active",
        },
      });

      // Check if all products exist and are active
      const productMap = new Map(products.map((p) => [p.id, p]));
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(
            `Product with ID ${item.productId} not found or inactive`
          );
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }
      }

      // 2. Create the sale record
      const sale = await tx.salesTransaction.create({
        data: {
          transaction_number: `${TRANSACTION_PREFIXES.POS}-${Date.now()}`,
          user_id: parseInt(request.user.id),
          subtotal,
          discount_amount: discount,
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: "completed",
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          customer_email: customerEmail || null,
          notes: notes || null,
        },
      });

      // 3. Create sale items and update stock levels atomically
      const saleItems = [];
      for (const item of items) {
        // Create sale item
        const saleItem = await tx.salesItem.create({
          data: {
            transaction_id: sale.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.total,
          },
        });
        saleItems.push(saleItem);

        // Update product stock atomically
        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Create stock adjustment record for audit trail
        await tx.stockAdjustment.create({
          data: {
            product_id: item.productId,
            user_id: parseInt(request.user.id),
            adjustment_type: "DECREASE",
            quantity: item.quantity,
            old_quantity: updatedProduct.stock + item.quantity,
            new_quantity: updatedProduct.stock,
            reason: `Sale transaction #${sale.transaction_number}`,
            status: "APPROVED",
          },
        });
      }

      return {
        sale,
        saleItems,
      };
    });

    return NextResponse.json({
      success: true,
      saleId: result.sale.id,
      message: SUCCESS_MESSAGES.SALE_COMPLETED,
      data: {
        saleId: result.sale.id,
        transactionNumber: result.sale.transaction_number,
        total: result.sale.total_amount,
        paymentMethod: result.sale.payment_method,
        change:
          paymentMethod === PAYMENT_METHODS.CASH && amountPaid
            ? Math.max(0, amountPaid - total)
            : 0,
        itemCount: result.saleItems.length,
      },
    });
  } catch (error) {
    console.error("Error creating sale:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: 500 }
    );
  }
}

export const POST = withPOSAuth(handleCreateSale);
