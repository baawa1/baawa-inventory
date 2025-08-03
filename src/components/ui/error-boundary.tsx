'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (_error: Error, _errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-destructive">Something went wrong</CardTitle>
        <CardDescription>
          An error occurred while rendering this component
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
          <p className="text-destructive font-mono text-sm">{error.message}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetError} variant="outline" size="sm">
            Try Again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="default"
            size="sm"
          >
            Reload Page
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="text-muted-foreground cursor-pointer text-sm">
              Error Details (Development)
            </summary>
            <pre className="bg-muted mt-2 overflow-auto rounded p-2 text-xs">
              {error.stack}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

// Form-specific error boundary with form context
export function FormErrorBoundary({
  children,
  formName,
  onError,
}: {
  children: React.ReactNode;
  formName: string;
  onError?: (_error: Error) => void;
}) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`Form error in ${formName}:`, error, errorInfo);
    onError?.(error);
  };

  const FormErrorFallback = ({ error, resetError }: ErrorFallbackProps) => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-destructive">Form Error</CardTitle>
        <CardDescription>
          An error occurred in the {formName} form
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
          <p className="text-destructive text-sm">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        <Button onClick={resetError} variant="outline" size="sm">
          Reset Form
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <ErrorBoundary fallback={FormErrorFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}

// Hook for handling async errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error('Async error:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}
