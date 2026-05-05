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
import { InlineLoading } from '@/components/ui/loading';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  IconUsers,
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
  useDeactivatedUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useReactivateUser,
  type CreateUserData,
  type UpdateUserData,
} from '@/hooks/api/users';
import { toast } from 'sonner';
import { useAdminGuard } from '@/hooks/useAdminGuard';

interface UserManagementProps {
  activeTab?: string;
}

const UserManagement = ({ activeTab: _activeTab }: UserManagementProps) => {
  const { isAdmin, isLoading: isAuthLoading } = useAdminGuard();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<'active' | 'inactive'>('active');

  const {
    data: activeUsers = [],
    isLoading: isActiveUsersLoading,
    refetch: refetchActiveUsers,
  } = useActiveUsers();
  const {
    data: inactiveUsers = [],
    isLoading: isInactiveUsersLoading,
    refetch: refetchInactiveUsers,
  } = useDeactivatedUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const reactivateUserMutation = useReactivateUser();

  const users = userFilter === 'active' ? activeUsers : inactiveUsers;
  const isLoading =
    userFilter === 'active' ? isActiveUsersLoading : isInactiveUsersLoading;
  const filteredUsers = users.filter(
    user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const refreshUsers = () => {
    void refetchActiveUsers();
    void refetchInactiveUsers();
  };

  const handleSubmit = async (data: UserFormData | EditUserFormData) => {
    try {
      if (editingUser) {
        const updateData: UpdateUserData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
          userStatus: data.userStatus,
        };

        await updateUserMutation.mutateAsync({
          id: parseInt(String(editingUser.id)),
          ...updateData,
        });
        toast.success('User updated successfully');
      } else if ('password' in data && 'confirmPassword' in data) {
        const createData: CreateUserData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
          userStatus: data.userStatus,
          password: data.password,
        };

        await createUserMutation.mutateAsync(createData);
        toast.success('User created successfully');
      } else {
        throw new Error('Password and confirm password are required for new users');
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      refreshUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      toast.success('User deactivated successfully');
      refreshUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleReactivateUser = async (user: User) => {
    try {
      await reactivateUserMutation.mutateAsync({
        id: parseInt(String(user.id)),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      });
      toast.success('User reactivated successfully');
      refreshUsers();
    } catch (error) {
      console.error('Error reactivating user:', error);
      toast.error('Failed to reactivate user');
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
          <InlineLoading label="Loading users..." />
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconUsers className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage active and inactive users created by administrators
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshUsers}
                disabled={isLoading}
              >
                <IconRefresh className="h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm" onClick={handleNewUser}>
                <IconUserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-sm flex-1">
              <IconSearch className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <Tabs
                value={userFilter}
                onValueChange={value =>
                  setUserFilter(value as 'active' | 'inactive')
                }
              >
                <TabsList>
                  <TabsTrigger value="active">
                    Active ({activeUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="inactive">
                    Inactive ({inactiveUsers.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Badge variant="secondary">
                {filteredUsers.length} {userFilter} users
              </Badge>
            </div>
          </div>

          <UserTable
            users={filteredUsers}
            isLoading={isLoading}
            onEdit={handleEditUser}
            onDeactivate={
              userFilter === 'active' ? handleDeactivateUser : undefined
            }
            onReactivate={
              userFilter === 'inactive' ? handleReactivateUser : undefined
            }
            variant={userFilter}
          />
        </CardContent>
      </Card>

      <UserDialog
        isOpen={isDialogOpen}
        onOpenChangeAction={handleDialogChange}
        user={editingUser}
        onSubmitAction={handleSubmit}
        isSubmitting={
          createUserMutation.isPending ||
          updateUserMutation.isPending ||
          reactivateUserMutation.isPending
        }
      />
    </div>
  );
};

export { UserManagement };
