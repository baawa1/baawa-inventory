import { NextResponse } from "next/server";
import { logger } from "./logger";

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class ApiErrorHandler {
  /**
   * Create a standardized error response
   */
  static createErrorResponse(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: Record<string, any>
  ): NextResponse<ApiError> {
    const error: ApiError = {
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
    };

    // Log error for debugging (without sensitive details)
    logger.error(`API Error [${statusCode}]: ${message}`, {
      code,
      statusCode,
      hasDetails: !!details,
    });

    return NextResponse.json(error, { status: statusCode });
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(
    errors: ValidationError[],
    message: string = "Validation failed"
  ): NextResponse<ApiError> {
    const details = errors.reduce(
      (acc, error) => {
        acc[error.field] = error.message;
        return acc;
      },
      {} as Record<string, string>
    );

    return this.createErrorResponse(message, 400, "VALIDATION_ERROR", details);
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(
    message: string = "Authentication required"
  ): NextResponse<ApiError> {
    return this.createErrorResponse(message, 401, "AUTHENTICATION_ERROR");
  }

  /**
   * Handle authorization errors
   */
  static handleForbiddenError(
    message: string = "Insufficient permissions"
  ): NextResponse<ApiError> {
    return this.createErrorResponse(message, 403, "FORBIDDEN_ERROR");
  }

  /**
   * Handle not found errors
   */
  static handleNotFoundError(
    message: string = "Resource not found"
  ): NextResponse<ApiError> {
    return this.createErrorResponse(message, 404, "NOT_FOUND_ERROR");
  }

  /**
   * Handle database errors
   */
  static handleDatabaseError(error: unknown): NextResponse<ApiError> {
    const message = "Database operation failed";

    // Log the actual error for debugging
    logger.error("Database error", {
      error: error instanceof Error ? error.message : "Unknown database error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return this.createErrorResponse(message, 500, "DATABASE_ERROR");
  }

  /**
   * Handle unexpected errors
   */
  static handleUnexpectedError(error: unknown): NextResponse<ApiError> {
    const message = "An unexpected error occurred";

    // Log the actual error for debugging
    logger.error("Unexpected error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return this.createErrorResponse(message, 500, "INTERNAL_ERROR");
  }

  /**
   * Handle rate limiting errors
   */
  static handleRateLimitError(
    message: string = "Too many requests"
  ): NextResponse<ApiError> {
    return this.createErrorResponse(message, 429, "RATE_LIMIT_ERROR");
  }

  /**
   * Handle business logic errors
   */
  static handleBusinessError(
    message: string,
    code: string = "BUSINESS_ERROR",
    details?: Record<string, any>
  ): NextResponse<ApiError> {
    return this.createErrorResponse(message, 400, code, details);
  }
}

// Convenience functions for common error types
export const createValidationError = (
  errors: ValidationError[],
  message?: string
) => ApiErrorHandler.handleValidationError(errors, message);

export const createAuthError = (message?: string) =>
  ApiErrorHandler.handleAuthError(message);

export const createForbiddenError = (message?: string) =>
  ApiErrorHandler.handleForbiddenError(message);

export const createNotFoundError = (message?: string) =>
  ApiErrorHandler.handleNotFoundError(message);

export const createDatabaseError = (error: unknown) =>
  ApiErrorHandler.handleDatabaseError(error);

export const createUnexpectedError = (error: unknown) =>
  ApiErrorHandler.handleUnexpectedError(error);

export const createRateLimitError = (message?: string) =>
  ApiErrorHandler.handleRateLimitError(message);

export const createBusinessError = (
  message: string,
  code?: string,
  details?: Record<string, any>
) => ApiErrorHandler.handleBusinessError(message, code, details);
