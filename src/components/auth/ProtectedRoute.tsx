"use client";

import React from "react";
import {
  useAuth,
  useRequireRole,
  useRequirePermission,
  UserRole,
  RolePermissions,
} from "@/lib/auth-rbac";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: keyof RolePermissions;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback,
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role-based access
  if (requiredRole) {
    const { role, permissions } = useAuth();
    const userRole = role as UserRole;

    // Admin always has access
    if (userRole !== "ADMIN") {
      const allowedRoles = Array.isArray(requiredRole)
        ? requiredRole
        : [requiredRole];

      if (!allowedRoles.includes(userRole)) {
        return fallback || <UnauthorizedFallback />;
      }
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    const { permissions } = useAuth();

    if (!permissions || !permissions[requiredPermission]) {
      return fallback || <UnauthorizedFallback />;
    }
  }

  return <>{children}</>;
}

function UnauthorizedFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-destructive">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/inventory">Go to Inventory</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/pos">Go to POS</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Higher-order component for protecting components
export function withRoleProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: UserRole | UserRole[],
  requiredPermission?: keyof RolePermissions
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute
        requiredRole={requiredRole}
        requiredPermission={requiredPermission}
      >
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}

// Utility component for conditionally rendering based on permissions
interface ConditionalRenderProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: keyof RolePermissions;
  fallback?: React.ReactNode;
}

export function ConditionalRender({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
}: ConditionalRenderProps) {
  const { role, permissions, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  const userRole = role as UserRole;

  // Check role-based access
  if (requiredRole) {
    // Admin always has access
    if (userRole !== "ADMIN") {
      const allowedRoles = Array.isArray(requiredRole)
        ? requiredRole
        : [requiredRole];

      if (!allowedRoles.includes(userRole)) {
        return <>{fallback}</>;
      }
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    if (!permissions || !permissions[requiredPermission]) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
