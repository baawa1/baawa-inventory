"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";

interface POSErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function POSErrorFallback({ error, resetError }: POSErrorFallbackProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  const isNetworkError =
    error.message.includes("fetch") ||
    error.message.includes("network") ||
    error.message.includes("NetworkError");

  const isValidationError =
    error.message.includes("validation") ||
    error.message.includes("invalid") ||
    error.message.includes("required");

  const isPOSError =
    error.message.includes("POS") ||
    error.message.includes("payment") ||
    error.message.includes("transaction") ||
    error.message.includes("stock");

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-destructive">
            {isPOSError ? "POS System Error" : "Something went wrong"}
          </CardTitle>
          <CardDescription>
            {isNetworkError &&
              "Unable to connect to the server. Please check your internet connection."}
            {isValidationError &&
              "There was a validation error with your input."}
            {isPOSError && "An error occurred in the POS system."}
            {!isNetworkError &&
              !isValidationError &&
              !isPOSError &&
              "An unexpected error occurred while processing your request."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive font-mono break-words">
              {error.message}
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            <Button
              onClick={resetError}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="default"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            <Button
              onClick={handleGoHome}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Error Details (Development)
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function POSErrorBoundary({
  children,
  componentName,
  onError,
}: {
  children: React.ReactNode;
  componentName: string;
  onError?: (error: Error) => void;
}) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    logger.error(`POS Error in ${componentName}`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Log to external service in production
    if (process.env.NODE_ENV === "production") {
      // Add your error logging service here
      // e.g., Sentry, LogRocket, etc.
    }

    onError?.(error);
  };

  return (
    <ErrorBoundary fallback={POSErrorFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}

// Hook for handling POS-specific async errors
export function usePOSErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    logger.error("POS Async error", {
      error: error.message,
      stack: error.stack,
    });
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}
