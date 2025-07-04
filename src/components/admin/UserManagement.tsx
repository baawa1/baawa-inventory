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
import { UserTable } from "./UserTable";
import { UserDialog } from "./UserDialog";
import {
  type User,
  type UserFormData,
  type EditUserFormData,
} from "./types/user";
import {
  useActiveUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  type CreateUserData,
  type UpdateUserData,
} from "@/hooks/api/users";
import { toast } from "sonner";
import { useAdminGuard } from "@/hooks/useAdminGuard";

export function UserManagement() {
  const { isAdmin, isLoading: isAuthLoading, session } = useAdminGuard();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // TanStack Query hooks
  const { data: users = [], isLoading, error } = useActiveUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Handle form submission
  const handleSubmit = async (data: UserFormData | EditUserFormData) => {
    try {
      if (editingUser) {
        // Update existing user
        const updateData: UpdateUserData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
          userStatus: data.userStatus,
        };

        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          ...updateData,
        });

        toast.success("User updated successfully");
      } else {
        // Create new user
        if (!("password" in data) || !data.password) {
          throw new Error("Password is required for new users");
        }

        const createData: CreateUserData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
          userStatus: data.userStatus,
          password: data.password,
        };

        await createUserMutation.mutateAsync(createData);
        toast.success("User created successfully");
      }

      // Close dialog and reset state
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save user";
      toast.error(errorMessage);
    }
  };

  // Handle user deletion/deactivation
  const handleDeleteUser = async (userId: number) => {
    if (userId.toString() === session?.user.id) {
      toast.error("Cannot delete your own account");
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(userId);
      toast.success("User deactivated successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete user";
      toast.error(errorMessage);
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
    }
  };

  if (isAuthLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  // Show error if there's a fetch error
  const errorMessage = error instanceof Error ? error.message : null;
  const isSubmitting =
    createUserMutation.isPending || updateUserMutation.isPending;

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

      {errorMessage && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
          {errorMessage}
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
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <UserDialog
        isOpen={isDialogOpen}
        onOpenChangeAction={handleDialogChange}
        user={editingUser}
        onSubmitAction={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
