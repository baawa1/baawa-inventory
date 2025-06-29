import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export class ApiException extends Error {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = "ApiException";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Helper function to get error code based on status
 */
function getErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 500:
      return "INTERNAL_ERROR";
    default:
      return "UNKNOWN_ERROR";
  }
}

/**
 * Standardized error response handler for API routes
 */
export function handleApiError(
  error: unknown,
  statusCode?: number
): NextResponse {
  // Handle validation errors (Zod)
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        })),
      },
      { status: 400 }
    );
  }

  // Handle custom API exceptions
  if (error instanceof ApiException) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Handle standard JavaScript errors with custom status code
  if (error instanceof Error && statusCode) {
    return NextResponse.json(
      {
        error: error.message,
        code: getErrorCode(statusCode),
      },
      { status: statusCode }
    );
  }

  // Handle Prisma errors
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as any;

    switch (prismaError.code) {
      case "P2002":
        return NextResponse.json(
          {
            error: "A record with this data already exists",
            code: "DUPLICATE_RECORD",
            details: prismaError.meta,
          },
          { status: 409 }
        );
      case "P2025":
        return NextResponse.json(
          {
            error: "Record not found",
            code: "NOT_FOUND",
            details: prismaError.meta,
          },
          { status: 404 }
        );
      case "P2003":
        return NextResponse.json(
          {
            error: "Foreign key constraint failed",
            code: "CONSTRAINT_VIOLATION",
            details: prismaError.meta,
          },
          { status: 400 }
        );
      default:
        console.error("Prisma error:", prismaError);
        return NextResponse.json(
          {
            error: "Database operation failed",
            code: "DATABASE_ERROR",
          },
          { status: 500 }
        );
    }
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    console.error("API Error:", error);

    // Don't expose internal error messages in production
    const isDevelopment = process.env.NODE_ENV === "development";

    return NextResponse.json(
      {
        error: isDevelopment ? error.message : "Internal server error",
        code: "INTERNAL_ERROR",
        ...(isDevelopment && { stack: error.stack }),
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  console.error("Unknown error:", error);
  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  );
}

/**
 * Creates a standardized API response
 */
export function createApiResponse(
  data: any,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(
  data: any,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * Creates a paginated response
 */
export function createPaginatedResponse(
  data: any[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  },
  message?: string
): NextResponse {
  return NextResponse.json({
    success: true,
    message,
    data,
    pagination,
  });
}

/**
 * Middleware wrapper for consistent error handling
 */
export function withErrorHandling<
  T extends (...args: any[]) => Promise<NextResponse>,
>(handler: T): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}
