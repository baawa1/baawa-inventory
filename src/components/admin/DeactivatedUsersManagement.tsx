"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDeactivatedUsers, useReactivateUser } from "@/hooks/api/users";
import type { AppUser as APIUser } from "@/types/user";
import { toast } from "sonner";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import {
  IconUserX,
  IconUserCheck,
  IconCalendar,
  IconRefresh,
} from "@tabler/icons-react";

// Use APIUser type directly
type User = APIUser;

export function DeactivatedUsersManagement() {
  const { isAdmin, isLoading: isAuthLoading } = useAdminGuard();
  const [activatingUser, setActivatingUser] = useState<string | null>(null);

  // TanStack Query hooks
  const { data: users = [], isLoading, error } = useDeactivatedUsers();
  const reactivateUserMutation = useReactivateUser();

  // Handle user reactivation
  const reactivateUser = async (user: User) => {
    try {
      setActivatingUser(user.id);

      await reactivateUserMutation.mutateAsync({
        id: parseInt(user.id),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      });

      toast.success("User reactivated successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reactivate user";
      toast.error(errorMessage);
    } finally {
      setActivatingUser(null);
    }
  };

  if (isAuthLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Deactivated Users
          </h2>
          <p className="text-muted-foreground">
            Manage and reactivate deactivated user accounts
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <IconRefresh className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Deactivated Users Metrics - Beautiful Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Deactivated Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gray-200/50 dark:bg-gray-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconUserX className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              Total Deactivated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                {users.length}
              </div>
              <div className="text-xs text-gray-600/70 dark:text-gray-400/70 mb-1">
                inactive accounts
              </div>
            </div>
            <div className="text-xs text-gray-600/70 dark:text-gray-400/70 mt-3">
              {users.length === 0
                ? "All users active"
                : "Manage inactive users"}
            </div>
          </CardContent>
        </Card>

        {/* Recently Deactivated Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-200/50 dark:bg-red-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconCalendar className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Recently Deactivated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {
                  users.filter((u) => {
                    const deactivatedDate = new Date(
                      u.updatedAt || u.createdAt
                    );
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return deactivatedDate > thirtyDaysAgo;
                  }).length
                }
              </div>
              <div className="text-xs text-red-600/70 dark:text-red-400/70 mb-1">
                last 30 days
              </div>
            </div>
            <div className="text-xs text-red-600/70 dark:text-red-400/70 mt-3">
              Recent deactivations
            </div>
          </CardContent>
        </Card>

        {/* Ready to Reactivate Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/50 dark:bg-blue-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconUserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Ready to Reactivate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {users.length}
              </div>
              <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mb-1">
                can be reactivated
              </div>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-3">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((users.length / Math.max(users.length, 1)) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* System Status Card */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/50 dark:bg-emerald-800/50 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <IconUserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {users.length === 0 ? "Clean" : "Needs Review"}
                </span>
              </div>
            </div>
            <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-3">
              {users.length === 0 ? "No deactivated users" : "Review required"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deactivated Users</CardTitle>
          <CardDescription>
            A list of all deactivated users in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div>Loading deactivated users...</div>
            </div>
          ) : error ? (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error instanceof Error ? error.message : "Failed to load users"}
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-muted-foreground">
                  No deactivated users found.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  All users are currently active.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "ADMIN"
                            ? "destructive"
                            : user.role === "MANAGER"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => reactivateUser(user)}
                        disabled={activatingUser === user.id}
                      >
                        {activatingUser === user.id
                          ? "Reactivating..."
                          : "Reactivate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
