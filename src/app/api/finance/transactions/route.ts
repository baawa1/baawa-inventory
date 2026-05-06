import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';
import {
  createTransactionSchema,
  transactionFiltersSchema,
} from '@/lib/validations/finance';
import {
  createApiResponse,
  transformDatabaseResponse,
} from '@/lib/api-response';
import { generateTransactionNumber } from '@/lib/utils';
import { createAuditLog } from '@/lib/audit';
import { AuditLogAction } from '@/types/audit';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { normalizeFinanceDateFilters } from '@/lib/finance/date-range';
import {
  addFinanceDateRangeIssue,
  optionalFinanceDateInputSchema,
} from '@/lib/finance/query-validation';
import {
  attachFinancialTransactionNames,
} from '@/lib/finance/transaction-access';
import {
  getNormalizedFinanceTransactions,
  normalizeFinancePaymentMethod,
} from '@/lib/finance/ledger';

const ledgerTransactionQuerySchema = z
  .object({
    startDate: optionalFinanceDateInputSchema,
    endDate: optionalFinanceDateInputSchema,
  })
  .superRefine((value, ctx) => {
    addFinanceDateRangeIssue(value.startDate, value.endDate, ctx);
  });

function normalizeLedgerType(value?: string | null): 'all' | 'income' | 'expense' {
  if (!value || value === 'ALL') {
    return 'all';
  }

  return value.toUpperCase() === 'INCOME' ? 'income' : 'expense';
}

function sortLedgerTransactions(
  transactions: Awaited<ReturnType<typeof getNormalizedFinanceTransactions>>,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
) {
  const direction = sortOrder === 'asc' ? 1 : -1;

  return [...transactions].sort((left, right) => {
    switch (sortBy) {
      case 'amount':
        return (left.amount - right.amount) * direction;
      case 'description':
        return left.description.localeCompare(right.description) * direction;
      case 'createdAt':
      case 'transactionDate':
      default:
        return (left.date.getTime() - right.date.getTime()) * direction;
    }
  });
}

async function getManualTransactionsResponse(
  request: AuthenticatedRequest
) {
  const { searchParams } = new URL(request.url);

  const queryParams = {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    search: searchParams.get('search') || undefined,
    type: searchParams.get('type') || undefined,
    status: searchParams.get('status') || undefined,
    paymentMethod: searchParams.get('paymentMethod') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    sortBy: searchParams.get('sortBy') || 'transactionDate',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  };

  const validatedQuery = transactionFiltersSchema.parse(queryParams);
  const {
    page,
    limit,
    search,
    type,
    status,
    paymentMethod,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  } = validatedQuery;

  const where: any = {};

  if (search) {
    where.OR = [
      { transactionNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (type && type !== 'ALL') where.type = type;
  if (status && status !== 'ALL') where.status = status;
  if (paymentMethod) {
    where.paymentMethod = normalizeFinancePaymentMethod(paymentMethod);
  }

  if (startDate || endDate) {
    const normalizedDateFilters = normalizeFinanceDateFilters(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    where.transactionDate = {};
    if (normalizedDateFilters.startDate) {
      where.transactionDate.gte = normalizedDateFilters.startDate;
    }
    if (normalizedDateFilters.endDate) {
      where.transactionDate.lte = normalizedDateFilters.endDate;
    }
  }

  const offset = (page - 1) * limit;

  const orderBy: any = {};
  if (sortBy === 'transactionDate') {
    orderBy.transactionDate = sortOrder;
  } else if (sortBy === 'amount') {
    orderBy.amount = sortOrder;
  } else if (sortBy === 'createdAt') {
    orderBy.createdAt = sortOrder;
  } else {
    orderBy.transactionDate = 'desc';
  }

  const [transactions, totalCount] = await Promise.all([
    prisma.financialTransaction.findMany({
      where,
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        expenseDetails: true,
        incomeDetails: true,
      },
      orderBy,
      skip: offset,
      take: limit,
    }),
    prisma.financialTransaction.count({ where }),
  ]);

  const transformedTransactions = transactions.map(transaction =>
    attachFinancialTransactionNames(
      transformDatabaseResponse(transaction) as typeof transaction
    )
  );

  return createApiResponse.successWithPagination(
    transformedTransactions,
    {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: offset + limit < totalCount,
      hasPrev: page > 1,
    },
    `Retrieved ${transactions.length} financial transactions`
  );
}

// GET /api/finance/transactions - List financial transactions with filtering
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Check if user has permission to read financial transactions
    if (!hasPermission(request.user.role, 'FINANCE_TRANSACTIONS_READ')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view financial transactions'
      );
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    if (view === 'manual') {
      return await getManualTransactionsResponse(request);
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '10', 10))
    );
    const sortBy = searchParams.get('sortBy') || 'transactionDate';
    const sortOrder =
      (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const validatedLedgerQuery = ledgerTransactionQuerySchema.parse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    });
    const normalizedDateFilters = normalizeFinanceDateFilters(
      validatedLedgerQuery.startDate,
      validatedLedgerQuery.endDate
    );

    const filters = {
      search: searchParams.get('search') || undefined,
      type: normalizeLedgerType(searchParams.get('type')),
      status: searchParams.get('status') || undefined,
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      startDate: normalizedDateFilters.startDate,
      endDate: normalizedDateFilters.endDate,
      source: searchParams.get('source') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      cashImpact: searchParams.get('cashImpact') || undefined,
      profitImpact: searchParams.get('profitImpact') || undefined,
      paymentState: searchParams.get('paymentState') || undefined,
    } as const;

    const unifiedTransactions = await getNormalizedFinanceTransactions(filters, {
      includeFlaggedOverlaps: true,
      manualStatusMode: 'all',
    });

    const sortedTransactions = sortLedgerTransactions(
      unifiedTransactions,
      sortBy,
      sortOrder
    );
    const offset = (page - 1) * limit;
    const paginatedTransactions = sortedTransactions.slice(offset, offset + limit);

    return createApiResponse.successWithPagination(
      paginatedTransactions.map(transaction => ({
        ...transaction,
        transactionDate: transaction.date.toISOString(),
        date: transaction.date.toISOString(),
      })),
      {
        page,
        limit,
        total: sortedTransactions.length,
        totalPages: Math.ceil(sortedTransactions.length / limit) || 1,
        hasNext: offset + limit < sortedTransactions.length,
        hasPrev: page > 1,
      },
      `Retrieved ${paginatedTransactions.length} finance ledger events`
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        error.issues[0]?.message || 'Invalid transaction filters',
        error.issues
      );
    }

    console.error('Error fetching financial transactions:', error);
    return createApiResponse.internalError('Failed to fetch transactions');
  }
});

// POST /api/finance/transactions - Create new financial transaction
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  logger.info(`[${requestId}] Starting finance transaction creation`, {
    userId: request.user.id,
    userEmail: request.user.email,
    userRole: request.user.role,
    timestamp: new Date().toISOString(),
  });

  try {
    // Check if user has permission to create financial transactions
    if (!hasPermission(request.user.role, 'FINANCE_TRANSACTIONS_CREATE')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to create financial transactions'
      );
    }
    // Parse JSON body
    let body;
    try {
      const rawBody = await request.text();
      body = JSON.parse(rawBody);
    } catch (parseError) {
      logger.error(`[${requestId}] Failed to parse JSON body`, {
        error:
          parseError instanceof Error ? parseError.message : String(parseError),
      });
      return createApiResponse.validationError('Invalid JSON in request body');
    }

    // Validate data with schema
    let validatedData;
    try {
      validatedData = createTransactionSchema.parse(body);
    } catch (validationError) {
      logger.error(`[${requestId}] Schema validation failed`, {
        error:
          validationError instanceof z.ZodError
            ? validationError.errors
            : validationError,
      });
      return createApiResponse.validationError(
        'Invalid transaction data',
        validationError instanceof z.ZodError
          ? validationError.errors
          : undefined
      );
    }

    // Generate transaction number
    let transactionNumber;
    try {
      transactionNumber = await generateTransactionNumber();
    } catch (numberError) {
      logger.error(`[${requestId}] Failed to generate transaction number`, {
        error:
          numberError instanceof Error
            ? numberError.message
            : String(numberError),
      });
      return createApiResponse.internalError(
        'Failed to generate transaction number'
      );
    }

    // Use Prisma transaction to ensure data consistency
    let result;
    try {
      result = await prisma.$transaction(async tx => {
        // Validate user ID before creating transaction
        const userId = parseInt(request.user.id);
        if (isNaN(userId) || userId <= 0) {
          throw new Error(`Invalid user ID: ${request.user.id}`);
        }

        // Check if user exists
        const userExists = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });

        if (!userExists) {
          throw new Error(`User with ID ${userId} not found in database`);
        }

        // Create the main transaction
        const transaction = await tx.financialTransaction.create({
          data: {
            transactionNumber,
            type: validatedData.type,
            amount: validatedData.amount,
            description: validatedData.description,
            transactionDate: new Date(validatedData.transactionDate),
            status: 'COMPLETED',
            paymentMethod: validatedData.paymentMethod as any,
            createdBy: userId,
          },
          include: {
            createdByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        // Create expense details if provided
        if (validatedData.type === 'EXPENSE') {
          await tx.expenseDetail.create({
            data: {
              transactionId: transaction.id,
              expenseType: (validatedData.expenseType as any) || '',
              vendorName: validatedData.vendorName,
            },
          });
        }

        // Create income details if provided
        if (validatedData.type === 'INCOME') {
          await tx.incomeDetail.create({
            data: {
              transactionId: transaction.id,
              incomeSource: (validatedData.incomeSource as any) || '',
              payerName: validatedData.payerName,
            },
          });
        }

        // Fetch complete transaction with all details in same transaction
        const completeTransaction = await tx.financialTransaction.findUnique({
          where: { id: transaction.id },
          include: {
            createdByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            expenseDetails: true,
            incomeDetails: true,
          },
        });

        return completeTransaction;
      });

      if (!result) {
        throw new Error('Failed to create transaction: no result returned');
      }

      const completeTransaction = result;

      // Create audit log
      try {
        await createAuditLog({
          userId: parseInt(request.user.id),
          action: AuditLogAction.FINANCE_TRANSACTION_CREATED,
          tableName: 'financial_transactions',
          recordId: completeTransaction.id,
          newValues: completeTransaction,
        });
      } catch (_auditError) {
        // Don't fail the request for audit log errors
      }

      const endTime = Date.now();
      const _duration = endTime - startTime;

      return createApiResponse.success(
        completeTransaction,
        'Financial transaction created successfully',
        201
      );
    } catch (dbError) {
      logger.error(`[${requestId}] Database transaction failed`, {
        error:
          dbError instanceof Error
            ? {
                message: dbError.message,
                stack: dbError.stack,
                name: dbError.name,
              }
            : dbError,
        validatedData,
      });

      logger.error(`[${requestId}] Database error details`, {
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
      });
      return createApiResponse.internalError(
        'Failed to create transaction. Please try again or contact support.'
      );
    }
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    logger.error(`[${requestId}] Finance transaction creation failed`, {
      duration: `${duration}ms`,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
      userId: request.user?.id || 'undefined',
    });

    // Check if it's a validation error
    if (error instanceof z.ZodError) {
      logger.error(`[${requestId}] Validation errors`, {
        errors: error.errors,
      });
      return createApiResponse.validationError(
        'Invalid transaction data',
        error.errors
      );
    }

    logger.error(`[${requestId}] Error details`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return createApiResponse.internalError(
      'Failed to create transaction. Please try again or contact support.'
    );
  }
});
