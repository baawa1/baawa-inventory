/**
 * Standardized API Response Utilities
 * Ensures consistent response formats across all API endpoints
 */

import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T = any> {
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
  details?: any;
  code?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

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
    details?: any,
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
    message: string = "Validation failed",
    details?: any
  ): NextResponse => {
    return NextResponse.json(
      {
        success: false,
        error: message,
        details,
        code: "VALIDATION_ERROR",
      } as ApiErrorResponse,
      { status: 400 }
    );
  },

  /**
   * Not found error response
   */
  notFound: (resource: string = "Resource", details?: any): NextResponse => {
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
    message: string = "Authentication required",
    details?: any
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
    message: string = "Insufficient permissions",
    details?: any
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
  conflict: (
    message: string = "Resource already exists",
    details?: any
  ): NextResponse => {
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
    details?: any
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
 * Helper function to transform database objects to camelCase
 * Ensures consistent field naming in API responses
 */
export const transformDatabaseResponse = <T extends Record<string, any>>(
  data: T
): T => {
  if (!data || typeof data !== "object") return data;

  const transformed = {} as T;

  for (const [key, value] of Object.entries(data)) {
    // Convert snake_case to camelCase for known database fields
    const transformedKey = transformFieldName(key);

    if (Array.isArray(value)) {
      transformed[transformedKey as keyof T] = value.map((item) =>
        typeof item === "object" && item !== null
          ? transformDatabaseResponse(item)
          : item
      ) as T[keyof T];
    } else if (
      value &&
      typeof value === "object" &&
      value.constructor === Object
    ) {
      transformed[transformedKey as keyof T] = transformDatabaseResponse(value);
    } else {
      transformed[transformedKey as keyof T] = value;
    }
  }

  return transformed;
};

/**
 * Transform common database field names to camelCase
 */
const transformFieldName = (fieldName: string): string => {
  const fieldMap: Record<string, string> = {
    // User fields
    user_status: "userStatus",
    email_verified: "emailVerified",
    email_verified_at: "emailVerifiedAt",
    first_name: "firstName",
    last_name: "lastName",
    created_at: "createdAt",
    updated_at: "updatedAt",
    last_login: "lastLogin",
    last_logout: "lastLogout",

    // Transaction fields
    transaction_number: "transactionNumber",
    customer_name: "customerName",
    customer_email: "customerEmail",
    customer_phone: "customerPhone",
    payment_method: "paymentMethod",
    payment_status: "paymentStatus",
    total_amount: "totalAmount",
    discount_amount: "discountAmount",
    tax_amount: "taxAmount",

    // Product fields
    min_stock: "minStock",
    max_stock: "maxStock",
    category_id: "categoryId",
    brand_id: "brandId",
    supplier_id: "supplierId",

    // Stock fields
    system_count: "systemCount",
    physical_count: "physicalCount",
    discrepancy_reason: "discrepancyReason",

    // Purchase order fields
    order_number: "orderNumber",
    order_date: "orderDate",

    // Add more mappings as needed
  };

  return fieldMap[fieldName] || fieldName;
};
