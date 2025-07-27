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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconSearch,
  IconFilter,
  IconCalendar,
  IconDatabase,
  IconRefresh,
  IconUserPlus,
  IconFileExport,
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
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  type CreateUserData,
  type UpdateUserData,
} from '@/hooks/api/users';
import { toast } from 'sonner';
import { useAdminGuard } from '@/hooks/useAdminGuard';

interface UserFilters {
  search: string;
  role: string;
  status: string;
  isActive: string;
  sortBy: string;
  sortOrder: string;
}

interface UserMetric {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const UserManagement = () => {
  const { isAdmin, isLoading: isAuthLoading, session } = useAdminGuard();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
    isActive: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // TanStack Query hooks
  const { data: users = [], isLoading, error, refetch } = useActiveUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Calculate user metrics
  const userMetrics: UserMetric[] = [
    {
      title: 'Total Users',
      value: users.length,
      change: 12.5,
      trend: 'up',
      icon: <IconUsers className="h-5 w-5" />,
      color: 'text-blue-600',
    },
    {
      title: 'Active Users',
      value: users.filter(u => u.isActive).length,
      change: 8.2,
      trend: 'up',
      icon: <IconUserCheck className="h-5 w-5" />,
      color: 'text-green-600',
    },
    {
      title: 'Pending Approval',
      value: users.filter(
        u => u.userStatus === 'VERIFIED' || u.userStatus === 'PENDING'
      ).length,
      change: -3.1,
      trend: 'down',
      icon: <IconCalendar className="h-5 w-5" />,
      color: 'text-yellow-600',
    },
    {
      title: 'Admins',
      value: users.filter(u => u.role === 'ADMIN').length,
      change: 0,
      trend: 'neutral',
      icon: <IconUserX className="h-5 w-5" />,
      color: 'text-purple-600',
    },
  ];

  // Filter users based on current filters
  const filteredUsers = users.filter(user => {
    const searchMatch =
      filters.search === '' ||
      user.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase());

    const roleMatch = filters.role === 'all' || user.role === filters.role;
    const statusMatch =
      filters.status === 'all' || user.userStatus === filters.status;
    const activeMatch =
      filters.isActive === 'all' ||
      (filters.isActive === 'true' && user.isActive) ||
      (filters.isActive === 'false' && !user.isActive);

    return searchMatch && roleMatch && statusMatch && activeMatch;
  });

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
          id: parseInt(editingUser.id),
          ...updateData,
        });

        toast.success('User updated successfully');
      } else {
        // Create new user
        if (!('password' in data) || !data.password) {
          throw new Error('Password is required for new users');
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
        toast.success('User created successfully');
      }

      // Close dialog and reset state
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save user';
      toast.error(errorMessage);
    }
  };

  // Handle user deletion/deactivation
  const handleDeleteUser = async (userId: number) => {
    if (userId.toString() === session?.user.id) {
      toast.error('Cannot delete your own account');
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(userId);
      toast.success('User deactivated successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete user';
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

  // Handle filter changes
  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      role: 'all',
      status: 'all',
      isActive: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  // Export users data
  const handleExportUsers = () => {
    const csvContent = [
      [
        'Name',
        'Email',
        'Role',
        'Status',
        'Active',
        'Created',
        'Last Login',
      ].join(','),
      ...filteredUsers.map(user =>
        [
          `"${user.firstName} ${user.lastName}"`,
          user.email,
          user.role,
          user.userStatus,
          user.isActive ? 'Yes' : 'No',
          new Date(user.createdAt).toLocaleDateString(),
          user.lastLogin
            ? new Date(user.lastLogin).toLocaleDateString()
            : 'Never',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Users data exported successfully');
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
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions with advanced analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <IconRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleExportUsers} variant="outline" size="sm">
            <IconFileExport className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleNewUser}>
            <IconUserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* User Metrics - Beautiful Gradient Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 transition-all duration-300 hover:shadow-lg dark:from-blue-950 dark:to-blue-900">
          <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-blue-200/50 dark:bg-blue-800/50"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-medium text-blue-700 dark:text-blue-300">
              <div className="rounded-lg bg-blue-100 p-2 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-800">
                <IconUsers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {userMetrics[0].value}
              </div>
              <div className="mb-1 text-xs text-blue-600/70 dark:text-blue-400/70">
                +{userMetrics[0].change}% growth
              </div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-blue-200 dark:bg-blue-800">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-400"
                style={{
                  width: `${Math.min(userMetrics[0].change, 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100 transition-all duration-300 hover:shadow-lg dark:from-green-950 dark:to-green-900">
          <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-green-200/50 dark:bg-green-800/50"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-medium text-green-700 dark:text-green-300">
              <div className="rounded-lg bg-green-100 p-2 transition-transform duration-300 group-hover:scale-110 dark:bg-green-800">
                <IconUserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {userMetrics[1].value}
              </div>
              <div className="mb-1 text-xs text-green-600/70 dark:text-green-400/70">
                +{userMetrics[1].change}% growth
              </div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-green-200 dark:bg-green-800">
              <div
                className="h-2 rounded-full bg-green-600 transition-all duration-500 dark:bg-green-400"
                style={{
                  width: `${Math.min(userMetrics[1].change, 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approval Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100 transition-all duration-300 hover:shadow-lg dark:from-orange-950 dark:to-orange-900">
          <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-orange-200/50 dark:bg-orange-800/50"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-medium text-orange-700 dark:text-orange-300">
              <div className="rounded-lg bg-orange-100 p-2 transition-transform duration-300 group-hover:scale-110 dark:bg-orange-800">
                <IconCalendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {userMetrics[2].value}
              </div>
              <div className="mb-1 text-xs text-orange-600/70 dark:text-orange-400/70">
                {userMetrics[2].change > 0 ? '+' : ''}
                {userMetrics[2].change}% change
              </div>
            </div>
            {Number(userMetrics[2].value) > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500"></div>
                <span className="text-xs text-orange-600/80 dark:text-orange-400/80">
                  Requires attention
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admins Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100 transition-all duration-300 hover:shadow-lg dark:from-purple-950 dark:to-purple-900">
          <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-purple-200/50 dark:bg-purple-800/50"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-medium text-purple-700 dark:text-purple-300">
              <div className="rounded-lg bg-purple-100 p-2 transition-transform duration-300 group-hover:scale-110 dark:bg-purple-800">
                <IconUserX className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {userMetrics[3].value}
              </div>
              <div className="mb-1 text-xs text-purple-600/70 dark:text-purple-400/70">
                System administrators
              </div>
            </div>
            <div className="mt-3 text-xs text-purple-600/70 dark:text-purple-400/70">
              Full system access
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <IconFilter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <IconFilter className="mr-2 h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="col-span-full lg:col-span-2">
                <div className="relative">
                  <IconSearch className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select
                value={filters.role}
                onValueChange={value => handleFilterChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={value => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.isActive}
                onValueChange={value => handleFilterChange('isActive', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Active" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="true">Active Only</SelectItem>
                  <SelectItem value="false">Inactive Only</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sortBy}
                onValueChange={value => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="firstName">First Name</SelectItem>
                  <SelectItem value="lastName">Last Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="lastLogin">Last Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        )}
      </Card>

      {errorMessage && (
        <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
              <CardDescription>
                {filters.search ||
                filters.role !== 'all' ||
                filters.status !== 'all' ||
                filters.isActive !== 'all'
                  ? `Filtered results from ${users.length} total users`
                  : 'A list of all users in the system with their roles and status'}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              <IconDatabase className="mr-1 h-3 w-3" />
              {filteredUsers.length} shown
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <UserTable
            users={filteredUsers}
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
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(UserManagement);
