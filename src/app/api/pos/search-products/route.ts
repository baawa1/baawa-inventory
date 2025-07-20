import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { withPOSAuth, AuthenticatedRequest } from "@/lib/api-auth-middleware";
import { PRODUCT_STATUS, API_LIMITS, ERROR_MESSAGES } from "@/lib/constants";
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
} from "@/lib/api-response";

// Validation schema for search parameters
const searchParamsSchema = z.object({
  search: z.string().min(1, "Search term is required"),
  limit: z
    .string()
    .optional()
    .default(API_LIMITS.PRODUCT_SEARCH_LIMIT.toString()),
  status: z.string().optional().default(PRODUCT_STATUS.ACTIVE),
});

async function handleSearchProducts(request: AuthenticatedRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const validatedParams = searchParamsSchema.parse({
      search: searchParams.get("search"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
    });

    const { search, limit, status } = validatedParams;
    const limitNum = parseInt(limit);

    // Build search conditions
    const searchConditions = {
      AND: [
        {
          status: status as "active" | "inactive" | "discontinued",
        },
        {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              sku: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              barcode: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              category: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              brand: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        },
      ],
    };

    // Search products
    const products = await prisma.product.findMany({
      where: searchConditions,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { stock: "desc" }, // Show in-stock products first
        { name: "asc" },
      ],
      take: limitNum,
    });

    // Format response data
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      stock: product.stock,
      status: product.status,
      category: product.category,
      brand: product.brand,
      description: product.description,
    }));

    return createSuccessResponse(
      {
        products: formattedProducts,
        total: formattedProducts.length,
        searchTerm: search,
      },
      `Found ${formattedProducts.length} products matching "${search}"`
    );
  } catch (error) {
    console.error("Error searching products for POS:", error);

    if (error instanceof z.ZodError) {
      return createValidationErrorResponse(
        error.errors,
        ERROR_MESSAGES.VALIDATION_ERROR
      );
    }

    return createInternalErrorResponse(ERROR_MESSAGES.INTERNAL_ERROR);
  }
}

export const GET = withPOSAuth(handleSearchProducts);
