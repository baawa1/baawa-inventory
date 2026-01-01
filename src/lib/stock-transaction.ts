/**
 * Stock Transaction Helper
 * Creates audit trail for all stock changes
 */

import { prisma } from '@/lib/db';
import { StockTransactionType, Prisma } from '@prisma/client';

export interface CreateStockTransactionParams {
  productId: number;
  quantity: number; // Positive or negative
  type: StockTransactionType;
  referenceType?: string; // "SalesTransaction", "StockAddition", etc.
  referenceId?: number;
  reason?: string;
  userId: number;
  previousStock: number;
  newStock: number;
}

/**
 * Create a stock transaction record
 * This should be called every time stock changes
 *
 * @param params - Transaction parameters
 * @param tx - Optional Prisma transaction client (for atomic operations)
 * @returns Created stock transaction
 */
export async function createStockTransaction(
  params: CreateStockTransactionParams,
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;

  return await client.stockTransaction.create({
    data: {
      productId: params.productId,
      quantity: params.quantity,
      type: params.type,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      reason: params.reason,
      userId: params.userId,
      previousStock: params.previousStock,
      newStock: params.newStock,
    },
  });
}

/**
 * Get stock transaction history for a product
 *
 * @param productId - Product ID
 * @param limit - Number of transactions to return
 * @returns Stock transactions with user details
 */
export async function getProductStockHistory(
  productId: number,
  limit: number = 50
) {
  return await prisma.stockTransaction.findMany({
    where: { productId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get all stock transactions with filters
 *
 * @param options - Filter options
 * @returns Filtered stock transactions
 */
export async function getStockTransactions(options: {
  productId?: number;
  type?: StockTransactionType;
  userId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.StockTransactionWhereInput = {};

  if (options.productId) where.productId = options.productId;
  if (options.type) where.type = options.type;
  if (options.userId) where.userId = options.userId;
  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) where.createdAt.gte = options.startDate;
    if (options.endDate) where.createdAt.lte = options.endDate;
  }

  const [transactions, total] = await Promise.all([
    prisma.stockTransaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0,
    }),
    prisma.stockTransaction.count({ where }),
  ]);

  return { transactions, total };
}

/**
 * Get stock transaction statistics
 *
 * @param productId - Optional product ID filter
 * @returns Transaction statistics
 */
export async function getStockTransactionStats(productId?: number) {
  const where: Prisma.StockTransactionWhereInput = productId
    ? { productId }
    : {};

  const stats = await prisma.stockTransaction.groupBy({
    by: ['type'],
    where,
    _count: { id: true },
    _sum: { quantity: true },
  });

  return stats.map(stat => ({
    type: stat.type,
    count: stat._count.id,
    totalQuantity: stat._sum.quantity || 0,
  }));
}
