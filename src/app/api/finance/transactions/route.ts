import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import {
  createTransactionSchema,
  transactionFiltersSchema,
} from "@/lib/validations/finance";
import {
  createApiResponse,
  transformDatabaseResponse,
} from "@/lib/api-response";
import { generateTransactionNumber } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { AuditLogAction } from "@/types/audit";
import { z } from "zod";
import { logger } from "@/lib/logger";

// GET /api/finance/transactions - List financial transactions with filtering
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,

      status: searchParams.get("status") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      sortBy: searchParams.get("sortBy") || "transactionDate",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const validatedQuery = transactionFiltersSchema.parse(queryParams);
    const {
      page,
      limit,
      search,
      type,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = validatedQuery;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { transactionNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type && type !== "ALL") where.type = type;
    if (status && status !== "ALL") where.status = status;

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === "transactionDate") {
      orderBy.transactionDate = sortOrder;
    } else if (sortBy === "amount") {
      orderBy.amount = sortOrder;
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.transactionDate = "desc";
    }

    // Get transactions with related data
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

    // Transform database response to camelCase for frontend
    const transformedTransactions = transactions.map((transaction) =>
      transformDatabaseResponse(transaction)
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
  } catch (error) {
    console.error("Error fetching financial transactions:", error);
    return createApiResponse.internalError("Failed to fetch transactions");
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
      return createApiResponse.validationError("Invalid JSON in request body");
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
        "Invalid transaction data",
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
        "Failed to generate transaction number"
      );
    }

    // Use Prisma transaction to ensure data consistency
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
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
        if (validatedData.type === "EXPENSE") {
          await tx.expenseDetail.create({
            data: {
              transactionId: transaction.id,
              expenseType: (validatedData.expenseType as any) || "",
              vendorName: validatedData.vendorName,
            },
          });
        }

        // Create income details if provided
        if (validatedData.type === "INCOME") {
          await tx.incomeDetail.create({
            data: {
              transactionId: transaction.id,
              incomeSource: (validatedData.incomeSource as any) || "",
              payerName: validatedData.payerName,
            },
          });
        }

        return transaction;
      });

      // Get complete transaction with details
      let completeTransaction;
      try {
        completeTransaction = await prisma.financialTransaction.findUnique({
          where: { id: result.id },
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
      } catch (_fetchError) {
        // Continue with the result we have
        completeTransaction = result;
      }

      // Create audit log
      try {
        await createAuditLog({
          userId: parseInt(request.user.id),
          action: AuditLogAction.SALE_CREATED,
          tableName: "financial_transactions",
          recordId: result.id,
          newValues: completeTransaction,
        });
      } catch (_auditError) {
        // Don't fail the request for audit log errors
      }

      const endTime = Date.now();
      const _duration = endTime - startTime;

      return createApiResponse.success(
        completeTransaction,
        "Financial transaction created successfully",
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

      // Return more specific error information
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";
      return createApiResponse.internalError(
        `Failed to create transaction in database: ${errorMessage}`
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
      userId: request.user?.id || "undefined",
    });

    // Check if it's a validation error
    if (error instanceof z.ZodError) {
      logger.error(`[${requestId}] Validation errors`, {
        errors: error.errors,
      });
      return createApiResponse.validationError(
        "Invalid transaction data",
        error.errors
      );
    }

    // Return more specific error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return createApiResponse.internalError(
      `Failed to create transaction: ${errorMessage}`
    );
  }
});
