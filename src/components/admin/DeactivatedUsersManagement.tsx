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
import {
  useDeactivatedUsers,
  useReactivateUser,
  type APIUser,
} from "@/hooks/api/users";
import { toast } from "sonner";
import { useAdminGuard } from "@/hooks/useAdminGuard";

// Use APIUser type directly
type User = APIUser;

export function DeactivatedUsersManagement() {
  const { isAdmin, isLoading: isAuthLoading } = useAdminGuard();
  const [activatingUser, setActivatingUser] = useState<number | null>(null);

  // TanStack Query hooks
  const { data: users = [], isLoading, error } = useDeactivatedUsers();
  const reactivateUserMutation = useReactivateUser();

  // Handle user reactivation
  const reactivateUser = async (user: User) => {
    try {
      setActivatingUser(user.id);

      await reactivateUserMutation.mutateAsync({
        id: user.id,
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deactivated Users</h2>
          <p className="text-muted-foreground">
            Manage and reactivate deactivated user accounts
          </p>
        </div>
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
