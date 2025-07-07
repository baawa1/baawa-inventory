import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for creating a sale
const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().positive(),
        quantity: z.number().positive(),
        price: z.number().positive(),
        total: z.number().positive(),
      })
    )
    .min(1, "At least one item is required"),
  subtotal: z.number().positive(),
  discount: z.number().min(0),
  total: z.number().positive(),
  paymentMethod: z.enum(["cash", "pos", "bank_transfer", "mobile_money"]),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  amountPaid: z.number().positive().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user status and role (POS requires at least STAFF role)
    const user = session.user;
    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Account not active" },
        { status: 403 }
      );
    }

    if (!["ADMIN", "MANAGER", "STAFF"].includes(user.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

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

    // Validate stock availability for all items
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
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
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found or inactive` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
          },
          { status: 400 }
        );
      }
    }

    // Validate payment amount for cash transactions
    if (paymentMethod === "cash" && amountPaid && amountPaid < total) {
      return NextResponse.json(
        { error: "Insufficient payment amount" },
        { status: 400 }
      );
    }

    // Create sale transaction in database
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the sale record
      const sale = await tx.salesTransaction.create({
        data: {
          transaction_number: `POS-${Date.now()}`,
          user_id: parseInt(user.id),
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

      // 2. Create sale items and update stock levels
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

        // Update product stock
        const currentProduct = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        });

        if (!currentProduct) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        const newStock = currentProduct.stock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
          },
        });

        // Create stock adjustment record for audit trail
        await tx.stockAdjustment.create({
          data: {
            product_id: item.productId,
            user_id: parseInt(user.id),
            adjustment_type: "DECREASE",
            quantity: item.quantity,
            old_quantity: currentProduct.stock,
            new_quantity: newStock,
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
      message: "Sale completed successfully",
      data: {
        saleId: result.sale.id,
        total: result.sale.total_amount,
        paymentMethod: result.sale.payment_method,
        change:
          paymentMethod === "cash" && amountPaid
            ? Math.max(0, amountPaid - total)
            : 0,
        itemCount: result.saleItems.length,
      },
    });
  } catch (error) {
    console.error("Error creating sale:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid sale data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process sale" },
      { status: 500 }
    );
  }
}
