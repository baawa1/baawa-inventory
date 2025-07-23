import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import {
  createTransactionSchema,
  transactionFiltersSchema,
} from "@/lib/validations/finance";
import { createApiResponse } from "@/lib/api-response";
import { generateTransactionNumber } from "@/lib/utils/finance";
import { createAuditLog } from "@/lib/audit";
import { AuditLogAction } from "@/types/audit";

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
        { referenceNumber: { contains: search, mode: "insensitive" } },
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

    return createApiResponse.successWithPagination(
      transactions,
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
  try {
    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);

    // Generate transaction number
    const transactionNumber = await generateTransactionNumber();

    // Use Prisma transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the main transaction
      const transaction = await tx.financialTransaction.create({
        data: {
          transactionNumber,
          type: validatedData.type,

          amount: validatedData.amount,
          currency: validatedData.currency,
          description: validatedData.description,
          transactionDate: validatedData.transactionDate,
          paymentMethod: validatedData.paymentMethod,
          referenceNumber: validatedData.referenceNumber,
          status: validatedData.status as any,
          createdBy: parseInt(request.user.id),
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
      if (validatedData.expenseDetails) {
        await tx.expenseDetail.create({
          data: {
            transactionId: transaction.id,
            expenseType: validatedData.expenseDetails.expenseType,
            vendorName: validatedData.expenseDetails.vendorName,
            vendorContact: validatedData.expenseDetails.vendorContact,
            taxAmount: validatedData.expenseDetails.taxAmount,
            taxRate: validatedData.expenseDetails.taxRate,
            receiptUrl: validatedData.expenseDetails.receiptUrl,
            notes: validatedData.expenseDetails.notes,
          },
        });
      }

      // Create income details if provided
      if (validatedData.incomeDetails) {
        await tx.incomeDetail.create({
          data: {
            transactionId: transaction.id,
            incomeSource: validatedData.incomeDetails.incomeSource,
            payerName: validatedData.incomeDetails.payerName,
            payerContact: validatedData.incomeDetails.payerContact,
            taxWithheld: validatedData.incomeDetails.taxWithheld,
            taxRate: validatedData.incomeDetails.taxRate,
            receiptUrl: validatedData.incomeDetails.receiptUrl,
            notes: validatedData.incomeDetails.notes,
          },
        });
      }

      return transaction;
    });

    // Get complete transaction with details
    const completeTransaction = await prisma.financialTransaction.findUnique({
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

    // Create audit log
    await createAuditLog({
      userId: parseInt(request.user.id),
      action: AuditLogAction.SALE_CREATED,
      tableName: "financial_transactions",
      recordId: result.id,
      newValues: completeTransaction,
    });

    return createApiResponse.success(
      completeTransaction,
      "Financial transaction created successfully",
      201
    );
  } catch (error) {
    console.error("Error creating financial transaction:", error);
    return createApiResponse.internalError("Failed to create transaction");
  }
});
