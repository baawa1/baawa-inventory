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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconSearch,
  IconFilter,
  IconCalendar,
  IconTrendingUp,
  IconTrendingDown,
  IconDatabase,
  IconRefresh,
  IconUserPlus,
  IconFileExport,
} from "@tabler/icons-react";
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
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
}

export function UserManagement() {
  const { isAdmin, isLoading: isAuthLoading, session } = useAdminGuard();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    role: "all",
    status: "all",
    isActive: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // TanStack Query hooks
  const { data: users = [], isLoading, error, refetch } = useActiveUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Calculate user metrics
  const userMetrics: UserMetric[] = [
    {
      title: "Total Users",
      value: users.length,
      change: 12.5,
      trend: "up",
      icon: <IconUsers className="h-5 w-5" />,
      color: "text-blue-600",
    },
    {
      title: "Active Users",
      value: users.filter((u) => u.isActive).length,
      change: 8.2,
      trend: "up",
      icon: <IconUserCheck className="h-5 w-5" />,
      color: "text-green-600",
    },
    {
      title: "Pending Approval",
      value: users.filter(
        (u) => u.userStatus === "VERIFIED" || u.userStatus === "PENDING"
      ).length,
      change: -3.1,
      trend: "down",
      icon: <IconCalendar className="h-5 w-5" />,
      color: "text-yellow-600",
    },
    {
      title: "Admins",
      value: users.filter((u) => u.role === "ADMIN").length,
      change: 0,
      trend: "neutral",
      icon: <IconUserX className="h-5 w-5" />,
      color: "text-purple-600",
    },
  ];

  // Filter users based on current filters
  const filteredUsers = users.filter((user) => {
    const searchMatch =
      filters.search === "" ||
      user.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase());

    const roleMatch = filters.role === "all" || user.role === filters.role;
    const statusMatch =
      filters.status === "all" || user.userStatus === filters.status;
    const activeMatch =
      filters.isActive === "all" ||
      (filters.isActive === "true" && user.isActive) ||
      (filters.isActive === "false" && !user.isActive);

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

  // Handle filter changes
  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      role: "all",
      status: "all",
      isActive: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  // Export users data
  const handleExportUsers = () => {
    const csvContent = [
      [
        "Name",
        "Email",
        "Role",
        "Status",
        "Active",
        "Created",
        "Last Login",
      ].join(","),
      ...filteredUsers.map((user) =>
        [
          `"${user.firstName} ${user.lastName}"`,
          user.email,
          user.role,
          user.userStatus,
          user.isActive ? "Yes" : "No",
          new Date(user.createdAt).toLocaleDateString(),
          user.lastLogin
            ? new Date(user.lastLogin).toLocaleDateString()
            : "Never",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Users data exported successfully");
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <IconTrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <IconTrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <IconTrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions with advanced analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportUsers} variant="outline" size="sm">
            <IconFileExport className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleNewUser}>
            <IconUserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* User Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {userMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-muted/30 ${metric.color}`}>
                  {metric.icon}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4">
                {getTrendIcon(metric.trend)}
                <span
                  className={`text-sm font-medium ${getTrendColor(metric.trend)}`}
                >
                  {metric.change > 0 ? "+" : ""}
                  {metric.change}%
                </span>
                <span className="text-sm text-muted-foreground">
                  from last period
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
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
                <IconFilter className="h-4 w-4 mr-2" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="col-span-full lg:col-span-2">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    className="pl-9"
                  />
                </div>
              </div>

              <Select
                value={filters.role}
                onValueChange={(value) => handleFilterChange("role", value)}
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
                onValueChange={(value) => handleFilterChange("status", value)}
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
                onValueChange={(value) => handleFilterChange("isActive", value)}
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
                onValueChange={(value) => handleFilterChange("sortBy", value)}
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
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
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
                filters.role !== "all" ||
                filters.status !== "all" ||
                filters.isActive !== "all"
                  ? `Filtered results from ${users.length} total users`
                  : "A list of all users in the system with their roles and status"}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              <IconDatabase className="h-3 w-3 mr-1" />
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
}
