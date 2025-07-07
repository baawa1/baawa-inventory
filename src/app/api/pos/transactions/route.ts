/**
 * API endpoint for fetching transaction history
 * Supports filtering and pagination for transaction management
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("50"),
  search: z.string().optional(),
  paymentMethod: z
    .enum(["cash", "pos", "bank_transfer", "mobile_money"])
    .optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  staffId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const { page, limit, search, paymentMethod, dateFrom, dateTo, staffId } =
      querySchema.parse(params);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { transaction_number: { contains: search, mode: "insensitive" } },
        { customer_name: { contains: search, mode: "insensitive" } },
        { customer_phone: { contains: search, mode: "insensitive" } },
        { customer_email: { contains: search, mode: "insensitive" } },
        {
          users: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (paymentMethod) {
      where.payment_method = paymentMethod;
    }

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.created_at.lte = new Date(dateTo + "T23:59:59");
      }
    }

    if (staffId) {
      where.user_id = parseInt(staffId);
    }

    // Get transactions with related data
    const [transactions, totalCount] = await Promise.all([
      prisma.salesTransaction.findMany({
        where,
        include: {
          sales_items: {
            include: {
              products: {
                select: {
                  name: true,
                  sku: true,
                  barcode: true,
                },
              },
            },
          },
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        skip: offset,
        take: limitNum,
      }),
      prisma.salesTransaction.count({ where }),
    ]);

    // Transform data for frontend
    const transformedTransactions = transactions.map((sale: any) => ({
      id: sale.id,
      items: sale.sales_items.map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        name: item.products?.name || "Unknown Product",
        sku: item.products?.sku || "",
        price: item.unit_price,
        quantity: item.quantity,
        total: item.total_price,
      })),
      subtotal: sale.subtotal,
      discount: sale.discount_amount,
      total: sale.total_amount,
      paymentMethod: sale.payment_method,
      customerName: sale.customer_name,
      customerPhone: sale.customer_phone,
      customerEmail: sale.customer_email,
      staffName: `${sale.users.firstName} ${sale.users.lastName}`.trim(),
      staffId: sale.user_id,
      timestamp: sale.created_at,
      createdAt: sale.created_at,
      updatedAt: sale.updated_at,
    }));

    return NextResponse.json({
      transactions: transformedTransactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can manually create transactions via API
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const transactionSchema = z.object({
      items: z.array(
        z.object({
          productId: z.number(),
          quantity: z.number().positive(),
          price: z.number().positive(),
        })
      ),
      subtotal: z.number().min(0),
      discount: z.number().min(0).default(0),
      total: z.number().positive(),
      paymentMethod: z.enum(["cash", "pos", "bank_transfer", "mobile_money"]),
      customerName: z.string().optional(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().email().optional(),
      staffId: z.number().optional(),
    });

    const validatedData = transactionSchema.parse(body);
    const staffId = validatedData.staffId || parseInt(session.user.id);

    // Create transaction in database
    const result = await prisma.$transaction(async (tx) => {
      // Create sale record
      const sale = await tx.salesTransaction.create({
        data: {
          transaction_number: `TXN-${Date.now()}`,
          subtotal: validatedData.subtotal,
          discount_amount: validatedData.discount,
          total_amount: validatedData.total,
          payment_method: validatedData.paymentMethod,
          customer_name: validatedData.customerName,
          customer_phone: validatedData.customerPhone,
          customer_email: validatedData.customerEmail,
          user_id: staffId,
        },
      });

      // Create sale items
      for (const item of validatedData.items) {
        await tx.salesItem.create({
          data: {
            transaction_id: sale.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
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
      }

      return sale;
    });

    return NextResponse.json({
      id: result.id,
      message: "Transaction created successfully",
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
