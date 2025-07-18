/**
 * API endpoint for fetching transaction history
 * Supports filtering and pagination for transaction management
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { withPOSAuth, AuthenticatedRequest } from "@/lib/api-auth-middleware";
import {
  ALL_PAYMENT_METHODS,
  API_LIMITS,
  ERROR_MESSAGES,
} from "@/lib/constants";

const querySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z
    .string()
    .optional()
    .default(API_LIMITS.TRANSACTION_HISTORY_LIMIT.toString()),
  search: z.string().optional(),
  paymentMethod: z
    .enum(ALL_PAYMENT_METHODS as [string, ...string[]])
    .optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  staffId: z.string().optional(),
});

async function handleGetTransactions(request: AuthenticatedRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const { page, limit, search, paymentMethod, dateFrom, dateTo, staffId } =
      querySchema.parse(params);

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), API_LIMITS.MAX_PAGE_SIZE);
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
      transactionNumber: sale.transaction_number,
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
      paymentStatus: sale.payment_status,
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

// Only GET endpoint - POST has been moved to /api/pos/create-sale
export const GET = withPOSAuth(handleGetTransactions);
