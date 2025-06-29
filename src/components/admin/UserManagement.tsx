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
import { UserTable } from "./UserTable";
import { UserDialog } from "./UserDialog";
import {
  type User,
  type UserFormData,
  type EditUserFormData,
} from "./types/user";

export function UserManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "ADMIN") {
      router.push("/unauthorized");
      return;
    }
  }, [session, status, router]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/users?isActive=true", {
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch users";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setUsers(data.users || data); // Handle both pagination and direct array responses
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user.role === "ADMIN") {
      fetchUsers();
    }
  }, [session]);

  // Handle form submission
  const handleSubmit = async (data: UserFormData | EditUserFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      // Prepare payload
      const payload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        userStatus: data.userStatus,
      };

      // Only add password if it's provided (for new users)
      if ("password" in data && data.password) {
        payload.password = data.password;
      }

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "Failed to save user";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      // Refresh users list
      await fetchUsers();

      // Close dialog and reset state
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle user deletion/deactivation
  const handleDeleteUser = async (userId: number) => {
    if (userId.toString() === session?.user.id) {
      setError("Cannot delete your own account");
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      await fetchUsers();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete user"
      );
    }
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  // Handle new user
  const handleNewUser = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingUser(null);
      setError(null);
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
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Button onClick={handleNewUser}>Add New User</Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            A list of all users in the system with their roles and status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserTable
            users={users}
            onEditUserAction={handleEditUser}
            onDeleteUserAction={handleDeleteUser}
            isLoading={loading}
          />
        </CardContent>
      </Card>

      <UserDialog
        isOpen={isDialogOpen}
        onOpenChangeAction={handleDialogChange}
        user={editingUser}
        onSubmitAction={handleSubmit}
        isSubmitting={submitting}
      />
    </div>
  );
}
