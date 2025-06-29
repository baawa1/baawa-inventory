import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createSupplierSchema,
  supplierQuerySchema,
} from "@/lib/validations/supplier";
import { handleApiError, createApiResponse } from "@/lib/api-error-handler";

// GET /api/suppliers - List suppliers with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return handleApiError(new Error("Unauthorized"), 401);
    }

    // Check permissions
    if (!["ADMIN", "MANAGER", "EMPLOYEE"].includes(session.user.role)) {
      return handleApiError(new Error("Insufficient permissions"), 403);
    }

    const { searchParams } = new URL(request.url);

    // Convert search params to proper types for validation
    const queryParams = {
      page: Math.max(parseInt(searchParams.get("page") || "1"), 1),
      limit: Math.min(parseInt(searchParams.get("limit") || "10"), 100),
      search: searchParams.get("search") || undefined,
      isActive: searchParams.get("isActive")
        ? searchParams.get("isActive") === "true"
        : undefined,
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    // Validate query parameters
    const validatedQuery = supplierQuerySchema.parse(queryParams);
    const { page, limit, search, isActive, sortBy, sortOrder } = validatedQuery;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where clause for Prisma
    const where: any = {};

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === "updatedAt") {
      orderBy.updatedAt = sortOrder;
    } else if (sortBy === "name") {
      orderBy.name = sortOrder;
    } else {
      orderBy.createdAt = sortOrder; // default fallback
    }

    // Execute queries in parallel for better performance
    const [suppliersData, totalCount] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    // Transform the data to match the component interface
    const suppliers = suppliersData.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      _count: {
        products: supplier._count.products,
        purchaseOrders: 0, // Will be 0 until purchaseOrders relation is added
      },
    }));

    return createApiResponse({
      success: true,
      data: suppliers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        offset,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return handleApiError(new Error("Unauthorized"), 401);
    }

    // Check permissions
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return handleApiError(new Error("Insufficient permissions"), 403);
    }

    const body = await request.json();
    const validatedData = createSupplierSchema.parse(body);

    // Check if supplier with same name already exists
    const existingSupplier = await prisma.supplier.findFirst({
      where: { name: validatedData.name },
      select: { id: true },
    });

    if (existingSupplier) {
      return handleApiError(
        new Error("Supplier with this name already exists"),
        409
      );
    }

    // Create the supplier with Prisma
    const supplier = await prisma.supplier.create({
      data: {
        name: validatedData.name,
        contactPerson: validatedData.contactPerson,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        country: validatedData.country,
        postalCode: validatedData.postalCode,
        website: validatedData.website,
        taxNumber: validatedData.taxNumber,
        paymentTerms: validatedData.paymentTerms,
        creditLimit: validatedData.creditLimit,
        isActive: validatedData.isActive,
        notes: validatedData.notes,
      },
    });

    return createApiResponse({ data: supplier }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
