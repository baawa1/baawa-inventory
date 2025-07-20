/**
 * Standardized API Response Utilities
 * Ensures consistent response formats across all API endpoints
 */

import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create standardized API responses
 */
export const createApiResponse = {
  /**
   * Success response with data
   */
  success: <T>(
    data: T,
    message?: string,
    status: number = 200
  ): NextResponse => {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
      } as ApiSuccessResponse<T>,
      { status }
    );
  },

  /**
   * Success response with pagination
   */
  successWithPagination: <T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext?: boolean;
      hasPrev?: boolean;
      hasNextPage?: boolean;
      hasPreviousPage?: boolean;
    },
    message?: string,
    status: number = 200
  ): NextResponse => {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
        pagination,
      } as ApiSuccessResponse<T[]>,
      { status }
    );
  },

  /**
   * Error response
   */
  error: (
    error: string,
    status: number = 500,
    details?: unknown,
    code?: string
  ): NextResponse => {
    return NextResponse.json(
      {
        success: false,
        error,
        details,
        code,
      } as ApiErrorResponse,
      { status }
    );
  },

  /**
   * Validation error response
   */
  validationError: (
    message: string,
    details?: unknown,
    status: number = 400
  ): NextResponse => {
    return NextResponse.json(
      {
        success: false,
        error: message,
        details,
        code: "VALIDATION_ERROR",
      } as ApiErrorResponse,
      { status }
    );
  },

  /**
   * Not found error response
   */
  notFound: (
    resource: string = "Resource",
    details?: unknown
  ): NextResponse => {
    return NextResponse.json(
      {
        success: false,
        error: `${resource} not found`,
        details,
        code: "NOT_FOUND",
      } as ApiErrorResponse,
      { status: 404 }
    );
  },

  /**
   * Unauthorized error response
   */
  unauthorized: (
    message: string = "Unauthorized",
    details?: unknown
  ): NextResponse => {
    return NextResponse.json(
      {
        success: false,
        error: message,
        details,
        code: "UNAUTHORIZED",
      } as ApiErrorResponse,
      { status: 401 }
    );
  },

  /**
   * Forbidden error response
   */
  forbidden: (
    message: string = "Forbidden",
    details?: unknown
  ): NextResponse => {
    return NextResponse.json(
      {
        success: false,
        error: message,
        details,
        code: "FORBIDDEN",
      } as ApiErrorResponse,
      { status: 403 }
    );
  },

  /**
   * Conflict error response
   */
  conflict: (message: string = "Conflict", details?: unknown): NextResponse => {
    return NextResponse.json(
      {
        success: false,
        error: message,
        details,
        code: "CONFLICT",
      } as ApiErrorResponse,
      { status: 409 }
    );
  },

  /**
   * Internal server error response
   */
  internalError: (
    message: string = "Internal server error",
    details?: unknown
  ): NextResponse => {
    return NextResponse.json(
      {
        success: false,
        error: message,
        details,
        code: "INTERNAL_ERROR",
      } as ApiErrorResponse,
      { status: 500 }
    );
  },
};

/**
 * Transform database response to ensure consistent field naming
 * Converts snake_case to camelCase for frontend consumption
 */
export const transformDatabaseResponse = <T extends Record<string, unknown>>(
  data: T
): T => {
  const transformed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const transformedKey = transformFieldName(key);
    transformed[transformedKey] = value;
  }

  return transformed as T;
};

/**
 * Transform field name from snake_case to camelCase
 */
const transformFieldName = (fieldName: string): string => {
  return fieldName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};
