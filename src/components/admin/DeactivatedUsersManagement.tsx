"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { UserRole } from "@/types/app";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export function DeactivatedUsersManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatingUser, setActivatingUser] = useState<number | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "ADMIN") {
      router.push("/unauthorized");
      return;
    }
  }, [session, status, router]);

  // Fetch deactivated users
  const fetchDeactivatedUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users?isActive=false", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch deactivated users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch deactivated users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user.role === "ADMIN") {
      fetchDeactivatedUsers();
    }
  }, [session]);

  // Handle user reactivation
  const reactivateUser = async (user: User) => {
    try {
      setActivatingUser(user.id);
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reactivate user");
      }

      await fetchDeactivatedUsers();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to reactivate user"
      );
    } finally {
      setActivatingUser(null);
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session || session.user.role !== "ADMIN") {
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
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div>Loading deactivated users...</div>
            </div>
          ) : error ? (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
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
