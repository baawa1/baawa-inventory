/**
 * Standardized API Response Utilities
 * Ensures consistent response formats across all API endpoints
 */

import { NextResponse } from "next/server";

// Base response structure
interface BaseAPIResponse {
  success: boolean;
  message?: string;
  timestamp: string;
}

// Success response structure
interface SuccessAPIResponse<T = any> extends BaseAPIResponse {
  success: true;
  data: T;
}

// Error response structure
interface ErrorAPIResponse extends BaseAPIResponse {
  success: false;
  error: string;
  details?: any;
}

// Pagination metadata
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Paginated response structure
interface PaginatedAPIResponse<T = any> extends SuccessAPIResponse<T[]> {
  pagination: PaginationInfo;
}

// Union type for all responses
export type APIResponse<T = any> = SuccessAPIResponse<T> | ErrorAPIResponse;
export type PaginatedResponse<T = any> = PaginatedAPIResponse<T>;

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response: SuccessAPIResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

/**
 * Create a standardized paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string,
  status: number = 200
): NextResponse {
  const paginationInfo: PaginationInfo = {
    page: pagination.page,
    limit: pagination.limit,
    total: pagination.total,
    pages: Math.ceil(pagination.total / pagination.limit),
    hasNextPage:
      pagination.page < Math.ceil(pagination.total / pagination.limit),
    hasPreviousPage: pagination.page > 1,
  };

  const response: PaginatedAPIResponse<T> = {
    success: true,
    data: items,
    pagination: paginationInfo,
    message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 400,
  details?: any,
  message?: string
): NextResponse {
  const response: ErrorAPIResponse = {
    success: false,
    error,
    details,
    message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  validationErrors: any[],
  message: string = "Validation failed"
): NextResponse {
  return createErrorResponse(
    "VALIDATION_ERROR",
    400,
    validationErrors,
    message
  );
}

/**
 * Create unauthorized error response
 */
export function createUnauthorizedResponse(
  message: string = "Authentication required"
): NextResponse {
  return createErrorResponse("UNAUTHORIZED", 401, undefined, message);
}

/**
 * Create forbidden error response
 */
export function createForbiddenResponse(
  message: string = "Insufficient permissions"
): NextResponse {
  return createErrorResponse("FORBIDDEN", 403, undefined, message);
}

/**
 * Create not found error response
 */
export function createNotFoundResponse(
  message: string = "Resource not found"
): NextResponse {
  return createErrorResponse("NOT_FOUND", 404, undefined, message);
}

/**
 * Create internal server error response
 */
export function createInternalErrorResponse(
  message: string = "Internal server error",
  details?: any
): NextResponse {
  return createErrorResponse("INTERNAL_ERROR", 500, details, message);
}

/**
 * Handle API errors consistently
 */
export function handleAPIError(error: any): NextResponse {
  console.error("API Error:", error);

  if (error instanceof Error) {
    return createErrorResponse(error.message, 400);
  }

  return createInternalErrorResponse();
}
