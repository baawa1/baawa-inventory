'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconSearch,
  IconRefresh,
  IconUserPlus,
} from '@tabler/icons-react';
import { UserTable } from './UserTable';
import { UserDialog } from './UserDialog';
import {
  type User,
  type UserFormData,
  type EditUserFormData,
} from './types/user';
import {
  useActiveUsers,
  usePendingUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  type CreateUserData,
  type UpdateUserData,
} from '@/hooks/api/users';
import { toast } from 'sonner';
import { useAdminGuard } from '@/hooks/useAdminGuard';

interface UserManagementProps {
  activeTab?: string;
}

const UserManagement = ({ activeTab }: UserManagementProps) => {
  const { isAdmin, isLoading: isAuthLoading } = useAdminGuard();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // TanStack Query hooks
  const {
    data: activeUsers = [],
    isLoading: activeLoading,
    refetch: refetchActive,
  } = useActiveUsers();
  const {
    data: pendingUsers = [],
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = usePendingUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Determine which data to show based on active tab
  const isPendingTab = activeTab === 'pending';
  const users = isPendingTab ? pendingUsers : activeUsers;
  const isLoading = isPendingTab ? pendingLoading : activeLoading;
  const refetch = isPendingTab ? refetchPending : refetchActive;

  // Filter users based on search term
  const filteredUsers = users.filter(
    user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          id: parseInt(editingUser.id),
          ...updateData,
        });
        toast.success('User updated successfully');
      } else {
        // Create new user
        if ('password' in data && 'confirmPassword' in data) {
          const createData: CreateUserData = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: data.role,
            userStatus: data.userStatus,
            password: data.password,
          };

          await createUserMutation.mutateAsync(createData);
        } else {
          throw new Error(
            'Password and confirm password are required for new users'
          );
        }
        toast.success('User created successfully');
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      refetch();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      toast.success('User deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleNewUser = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingUser(null);
    }
  };

  if (isAuthLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground mt-2 text-sm">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <IconUserX className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">Access Denied</h3>
            <p className="text-muted-foreground text-sm">
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isPendingTab ? (
                  <>
                    <IconUserCheck className="h-5 w-5" />
                    Pending User Approvals
                  </>
                ) : (
                  <>
                    <IconUsers className="h-5 w-5" />
                    User Management
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isPendingTab
                  ? 'Review and approve new user registrations'
                  : 'Manage active users and their permissions'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <IconRefresh className="h-4 w-4" />
                Refresh
              </Button>
              {!isPendingTab && (
                <Button size="sm" onClick={handleNewUser}>
                  <IconUserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              {filteredUsers.length} {isPendingTab ? 'pending' : 'active'} users
            </Badge>
          </div>

          {/* User Table */}
          <UserTable
            users={filteredUsers}
            isLoading={isLoading}
            isPendingTab={isPendingTab}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onApprove={async userId => {
              try {
                const response = await fetch('/api/admin/approve-user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId }),
                });

                if (!response.ok) {
                  throw new Error('Failed to approve user');
                }

                toast.success('User approved successfully');
                refetch();
              } catch (error) {
                console.error('Error approving user:', error);
                toast.error('Failed to approve user');
              }
            }}
            onReject={async userId => {
              try {
                const response = await fetch('/api/admin/reject-user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId }),
                });

                if (!response.ok) {
                  throw new Error('Failed to reject user');
                }

                toast.success('User rejected successfully');
                refetch();
              } catch (error) {
                console.error('Error rejecting user:', error);
                toast.error('Failed to reject user');
              }
            }}
          />
        </CardContent>
      </Card>

      {/* User Dialog */}
      <UserDialog
        isOpen={isDialogOpen}
        onOpenChangeAction={handleDialogChange}
        user={editingUser}
        onSubmitAction={handleSubmit}
        isSubmitting={
          createUserMutation.isPending || updateUserMutation.isPending
        }
      />
    </div>
  );
};

export { UserManagement };
