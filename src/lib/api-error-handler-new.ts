import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger';

// ===== TYPE DEFINITIONS =====

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface PrismaErrorMeta {
  target?: string[];
  [key: string]: unknown;
}

export interface PrismaError {
  code: string;
  meta?: PrismaErrorMeta;
  target?: string[];
  message: string;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

export interface ApiResponseData {
  [key: string]: unknown;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SuccessResponse<T = ApiResponseData> {
  success: true;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T = ApiResponseData> {
  success: true;
  message?: string;
  data: T[];
  pagination: PaginationInfo;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
  stack?: string;
}

// ===== API EXCEPTION CLASS =====

export class ApiException extends Error {
  public statusCode: number;
  public code?: string;
  public details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Helper function to get error code based on status
 */
function getErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 500:
      return 'INTERNAL_ERROR';
    default:
      return 'UNKNOWN_ERROR';
  }
}

/**
 * Type guard to check if error is a Prisma error
 */
function isPrismaError(error: unknown): error is PrismaError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as PrismaError).code === 'string'
  );
}

// ===== MAIN ERROR HANDLER =====

/**
 * Standardized error response handler for API routes
 */
export function handleApiError(
  error: unknown,
  statusCode?: number
): NextResponse {
  // Handle validation errors (Zod)
  if (error instanceof ZodError) {
    const validationDetails: ValidationErrorDetail[] = error.errors.map(
      err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })
    );

    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationDetails,
      } as ErrorResponse,
      { status: 400 }
    );
  }

  // Handle custom API exceptions
  if (error instanceof ApiException) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code || getErrorCode(error.statusCode),
        details: error.details,
      } as ErrorResponse,
      { status: error.statusCode }
    );
  }

  // Handle standard JavaScript errors with custom status code
  if (error instanceof Error && statusCode) {
    return NextResponse.json(
      {
        error: error.message,
        code: getErrorCode(statusCode),
      } as ErrorResponse,
      { status: statusCode }
    );
  }

  // Handle Prisma errors
  if (isPrismaError(error)) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: 'A record with this data already exists',
            code: 'DUPLICATE_RECORD',
            details: error.meta,
          } as ErrorResponse,
          { status: 409 }
        );
      case 'P2025':
        return NextResponse.json(
          {
            error: 'Record not found',
            code: 'NOT_FOUND',
            details: error.meta,
          } as ErrorResponse,
          { status: 404 }
        );
      case 'P2003':
        return NextResponse.json(
          {
            error: 'Foreign key constraint failed',
            code: 'CONSTRAINT_VIOLATION',
            details: error.meta,
          } as ErrorResponse,
          { status: 400 }
        );
      default:
        logger.error('Prisma database error', {
          code: error.code,
          meta: error.meta,
          target: error.target,
          message: error.message,
        });
        return NextResponse.json(
          {
            error: 'Database operation failed',
            code: 'DATABASE_ERROR',
          } as ErrorResponse,
          { status: 500 }
        );
    }
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    logger.error('API endpoint error', {
      error: error.message,
      stack: error.stack,
    });

    // Don't expose internal error messages in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      {
        error: isDevelopment ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(isDevelopment && { stack: error.stack }),
      } as ErrorResponse,
      { status: 500 }
    );
  }

  // Handle unknown errors
  logger.error('Unknown error occurred', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    } as ErrorResponse,
    { status: 500 }
  );
}

// ===== RESPONSE CREATORS =====

/**
 * Creates a standardized API response
 */
export function createApiResponse<T = ApiResponseData>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T = ApiResponseData>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    } as SuccessResponse<T>,
    { status }
  );
}

/**
 * Creates a paginated response
 */
export function createPaginatedResponse<T = ApiResponseData>(
  data: T[],
  pagination: PaginationInfo,
  message?: string
): NextResponse {
  return NextResponse.json({
    success: true,
    message,
    data,
    pagination,
  } as PaginatedResponse<T>);
}

// ===== MIDDLEWARE WRAPPER =====

/**
 * Middleware wrapper for consistent error handling
 */
export function withErrorHandling<
  T extends (..._args: unknown[]) => Promise<NextResponse>,
>(handler: T): T {
  return (async (..._args: unknown[]) => {
    try {
      return await handler(..._args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}
