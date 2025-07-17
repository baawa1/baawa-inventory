import { toast } from "sonner";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, status: number = 500, code: string = "INTERNAL_ERROR", details?: any) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Extracts error message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  
  return "An unexpected error occurred";
};

/**
 * Handles API errors with consistent toast messages
 */
export const handleApiError = (error: unknown, context?: string): void => {
  const message = getErrorMessage(error);
  const contextMessage = context ? `${context}: ${message}` : message;
  
  console.error(`API Error${context ? ` (${context})` : ""}:`, error);
  toast.error(contextMessage);
};

/**
 * Success toast with consistent styling
 */
export const showSuccess = (message: string): void => {
  toast.success(message);
};

/**
 * Warning toast with consistent styling
 */
export const showWarning = (message: string): void => {
  toast.warning(message);
};

/**
 * Info toast with consistent styling
 */
export const showInfo = (message: string): void => {
  toast.info(message);
};

/**
 * Generic error toast
 */
export const showError = (message: string): void => {
  toast.error(message);
};

/**
 * Handle form validation errors
 */
export const handleFormError = (error: unknown, fieldName?: string): void => {
  const message = getErrorMessage(error);
  const contextMessage = fieldName ? `${fieldName}: ${message}` : message;
  
  console.error(`Form Error${fieldName ? ` (${fieldName})` : ""}:`, error);
  toast.error(contextMessage);
};

/**
 * Handle network errors
 */
export const handleNetworkError = (error: unknown): void => {
  console.error("Network Error:", error);
  toast.error("Network error. Please check your connection and try again.");
};

/**
 * Handle authentication errors
 */
export const handleAuthError = (error: unknown): void => {
  console.error("Authentication Error:", error);
  toast.error("Authentication failed. Please log in again.");
};

/**
 * Handle permission errors
 */
export const handlePermissionError = (error: unknown): void => {
  console.error("Permission Error:", error);
  toast.error("You don't have permission to perform this action.");
};

/**
 * Standardized error handling for different contexts
 */
export const ErrorHandlers = {
  api: handleApiError,
  form: handleFormError,
  network: handleNetworkError,
  auth: handleAuthError,
  permission: handlePermissionError,
  success: showSuccess,
  warning: showWarning,
  info: showInfo,
  error: showError,
} as const;

/**
 * Async error wrapper for handling promise rejections
 */
export const withErrorHandling = async <T>(
  promise: Promise<T>,
  context?: string
): Promise<T | null> => {
  try {
    return await promise;
  } catch (error) {
    handleApiError(error, context);
    return null;
  }
};

/**
 * Error boundary error handler
 */
export const handleErrorBoundaryError = (error: Error, errorInfo: React.ErrorInfo): void => {
  console.error("Error Boundary caught an error:", error, errorInfo);
  
  // In production, you might want to send this to an error reporting service
  if (process.env.NODE_ENV === "production") {
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }
};