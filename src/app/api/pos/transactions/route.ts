/**
 * API endpoint for fetching transaction history
 * Supports filtering and pagination for transaction management
 *
 * NOTE: This file uses snake_case field names because the SalesTransaction
 * model in Prisma schema doesn't follow the workspace rule of using camelCase
 * with @map directives. This should be fixed in a future schema migration.
 */

import { prisma } from '@/lib/db';
import { z } from 'zod';
import { withPOSAuth, AuthenticatedRequest } from '@/lib/api-auth-middleware';
import {
  API_LIMITS,
  ERROR_MESSAGES,
  SUCCESSFUL_PAYMENT_STATUSES,
} from '@/lib/constants';
import { POS_PAYMENT_METHODS } from '@/lib/constants/pos';
import { createApiResponse } from '@/lib/api-response';
import { SalesTransactionWithIncludes } from '@/types/pos';
import { logger } from '@/lib/logger';
import { normalizePaymentStatus } from '@/lib/utils/payment-status';
import { normalizePaymentMethodForStorage } from '@/lib/utils/payment-methods';

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z
    .string()
    .optional()
    .default(API_LIMITS.TRANSACTION_HISTORY_LIMIT.toString()),
  search: z.string().optional(),
  paymentMethod: z
    .string()
    .optional()
    .transform(value =>
      value ? normalizePaymentMethodForStorage(value) : undefined
    )
    .refine(value => !value || POS_PAYMENT_METHODS.includes(value as any), {
      message: 'Invalid payment method',
    }),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  staffId: z.string().optional(),
  paymentStatus: z.string().optional(),
});

const paymentMethodVariants = (method: string): string[] => {
  switch (method) {
    case 'pos':
      return ['pos', 'POS', 'pos_machine', 'POS_MACHINE', 'credit_card', 'CREDIT_CARD'];
    case 'bank_transfer':
      return ['bank_transfer', 'BANK_TRANSFER', 'bank', 'BANK'];
    case 'mobile_money':
      return ['mobile_money', 'MOBILE_MONEY', 'mobile', 'MOBILE'];
    case 'cash':
      return ['cash', 'CASH'];
    case 'debt':
      return ['debt', 'DEBT'];
    case 'split':
      return ['split', 'SPLIT'];
    default:
      return [method, method.toUpperCase()];
  }
};

async function handleGetTransactions(request: AuthenticatedRequest) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const {
      page,
      limit,
      search,
      paymentMethod,
      dateFrom,
      dateTo,
      staffId,
      paymentStatus,
    } =
      querySchema.parse(params);

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), API_LIMITS.MAX_PAGE_SIZE);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause with proper typing
    const where: any = {};

    if (search) {
      where.OR = [
        { transaction_number: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          users: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (paymentMethod) {
      where.payment_method = { in: paymentMethodVariants(paymentMethod) };
    }

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.created_at.lte = new Date(dateTo + 'T23:59:59');
      }
    }

    if (staffId) {
      where.user_id = parseInt(staffId);
    }

    const rawStatuses = paymentStatus
      ? paymentStatus
          .split(',')
          .map(status => status.trim())
          .filter(Boolean)
      : [];

    const normalizedStatuses = Array.from(
      new Set(
        rawStatuses.flatMap(status => {
          const normalized = normalizePaymentStatus(status);
          if (!normalized) return [];

          if (normalized === 'PAID') {
            return SUCCESSFUL_PAYMENT_STATUSES;
          }

          if (normalized === 'PARTIAL') {
            return ['PARTIAL', 'partial'];
          }

          if (normalized === 'PENDING') {
            return ['PENDING', 'pending'];
          }

          if (normalized === 'CANCELLED') {
            return ['CANCELLED', 'cancelled', 'canceled'];
          }

          if (normalized === 'REFUNDED') {
            return ['REFUNDED', 'refunded'];
          }

          return [normalized, normalized.toLowerCase()];
        })
      )
    );

    if (normalizedStatuses.length > 0) {
      where.payment_status = { in: normalizedStatuses };
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
                },
              },
              coupon: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  type: true,
                  value: true,
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
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              city: true,
              state: true,
              customerType: true,
            },
          },
          transaction_fees: {
            select: {
              id: true,
              feeType: true,
              description: true,
              amount: true,
              createdAt: true,
            },
          },
          split_payments: {
            select: {
              id: true,
              amount: true,
              payment_method: true,
              created_at: true,
            },
            orderBy: {
              created_at: 'asc',
            },
          },
          transaction_payments: {
            select: {
              id: true,
              amount: true,
              payment_method: true,
              note: true,
              payment_date: true,
              recorded_by: true,
              created_at: true,
              recordedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: [
              { payment_date: 'asc' },
              { created_at: 'asc' },
            ],
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip: offset,
        take: limitNum,
      } as any),
      prisma.salesTransaction.count({ where }),
    ]);

    // Transform data for frontend with proper typing
    const transformedTransactions: any[] = transactions.map((sale: any) => {
      const splitPayments = sale.split_payments || [];
      const ledgerPayments = sale.transaction_payments || [];
      const splitPaid = splitPayments.reduce(
        (sum: number, payment: any) =>
          payment.payment_method === 'debt'
            ? sum
            : sum + Number(payment.amount || 0),
        0
      );
      const ledgerPaid = ledgerPayments.reduce(
        (sum: number, payment: any) => sum + Number(payment.amount || 0),
        0
      );
      const paymentStatus = normalizePaymentStatus(sale.payment_status);
      let amountPaid = splitPaid + ledgerPaid;
      let balanceDue = Math.max(0, Number(sale.total_amount) - amountPaid);

      if (amountPaid <= 0.01 && paymentStatus === 'PAID') {
        amountPaid = Number(sale.total_amount);
        balanceDue = 0;
      }

      const normalizedMethod =
        normalizePaymentMethodForStorage(sale.payment_method) ||
        sale.payment_method;

      return {
        id: sale.id,
        transactionNumber: sale.transaction_number,
        items: sale.sales_items.map((item: any) => ({
          id: item.id,
          productId: item.product_id || 0, // Handle null case
          name: item.products?.name || 'Unknown Product',
          sku: item.products?.sku || '',
          price: Number(item.unit_price), // Convert Decimal to number
          quantity: item.quantity,
          total: Number(item.total_price), // Convert Decimal to number
          coupon: item.coupon
            ? {
                id: item.coupon.id,
                code: item.coupon.code,
                name: item.coupon.name,
                type: item.coupon.type,
                value: Number(item.coupon.value),
              }
            : null,
        })),
        subtotal: Number(sale.subtotal), // Convert Decimal to number
        discount: Number(sale.discount_amount), // Convert Decimal to number
        total: Number(sale.total_amount), // Convert Decimal to number
        paymentMethod: normalizedMethod,
        paymentStatus: paymentStatus ?? sale.payment_status,
        // Enhanced customer information
        customer: sale.customer
          ? {
              id: sale.customer.id,
              name: sale.customer.name,
              email: sale.customer.email,
              phone: sale.customer.phone,
              city: sale.customer.city,
              state: sale.customer.state,
              customerType: sale.customer.customerType,
            }
          : null,
        // Transaction fees
        fees:
          sale.transaction_fees?.map((fee: any) => ({
            id: fee.id,
            type: fee.feeType,
            description: fee.description,
            amount: Number(fee.amount),
            createdAt: fee.createdAt,
          })) || [],
        customerName: sale.customer_name,
        customerPhone: sale.customer_phone,
        customerEmail: sale.customer_email,
        staffName: `${sale.users.firstName} ${sale.users.lastName}`.trim(),
        staffId: sale.user_id,
        timestamp: sale.created_at,
        createdAt: sale.created_at,
        updatedAt: sale.updated_at,
        notes: sale.notes,
        amountPaid,
        balanceDue,
        splitPayments: splitPayments.map((payment: any) => ({
          id: payment.id,
          amount: Number(payment.amount),
          method:
            normalizePaymentMethodForStorage(payment.payment_method) ||
            payment.payment_method,
          createdAt: payment.created_at,
        })),
        transactionPayments: ledgerPayments.map((payment: any) => ({
          id: payment.id,
          amount: Number(payment.amount),
          method:
            normalizePaymentMethodForStorage(payment.payment_method) ||
            payment.payment_method,
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
        })),
      };
    });

    return createApiResponse.successWithPagination(
      transformedTransactions,
      {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1,
      },
      `Retrieved ${transformedTransactions.length} of ${totalCount} transactions`
    );
  } catch (error) {
    logger.error('Error fetching transactions', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        ERROR_MESSAGES.VALIDATION_ERROR,
        error.errors
      );
    }

    return createApiResponse.internalError(ERROR_MESSAGES.INTERNAL_ERROR);
  }
}

// Only GET endpoint - POST has been moved to /api/pos/create-sale
export const GET = withPOSAuth(handleGetTransactions);
