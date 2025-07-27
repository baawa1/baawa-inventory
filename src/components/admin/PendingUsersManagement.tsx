'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import { usePendingUsers, useApproveUser } from '@/hooks/api/users';
import type { AppUser as APIUser } from '@/types/user';
import { toast } from 'sonner';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import type { UserStatus } from '@/types/user';

const statusConfig = {
  PENDING: {
    label: 'Pending Verification',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  VERIFIED: {
    label: 'Awaiting Approval',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  SUSPENDED: {
    label: 'Suspended',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertCircle,
  },
};

export function PendingUsersManagement() {
  const { isAdmin, isLoading: isAuthLoading } = useAdminGuard();
  const [selectedUser, setSelectedUser] = useState<APIUser | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // TanStack Query hooks
  const {
    data: pendingUsers = [],
    isLoading,
    error,
    refetch,
  } = usePendingUsers(filterStatus);
  const approveUserMutation = useApproveUser();

  // Filter users based on selected status
  const filteredUsers = pendingUsers;

  // Handle user approval
  const handleApproveUser = async (user: APIUser) => {
    try {
      await approveUserMutation.mutateAsync({
        userId: parseInt(user.id),
        action: 'approve',
      });

      toast.success('User approved successfully');
      setIsDetailsDialogOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to approve user';
      toast.error(errorMessage);
    }
  };

  // Handle user rejection
  const handleRejectUser = async (user: APIUser, reason?: string) => {
    try {
      await approveUserMutation.mutateAsync({
        userId: parseInt(user.id),
        action: 'reject',
        rejectionReason: reason || 'Application rejected by administrator',
      });

      toast.success('User rejected successfully');
      setIsDetailsDialogOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to reject user';
      toast.error(errorMessage);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show user details in dialog
  const showUserDetails = (user: APIUser) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  if (isAuthLoading || isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
          Loading pending users...
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const errorMessage = error instanceof Error ? error.message : null;
  const isProcessing = approveUserMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Pending User Approvals
          </h2>
          <p className="text-muted-foreground">
            Review and approve users waiting for account activation
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Pending Users Metrics - Beautiful Gradient Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Pending Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100 transition-all duration-300 hover:shadow-lg dark:from-orange-950 dark:to-orange-900">
          <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-orange-200/50 dark:bg-orange-800/50"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-medium text-orange-700 dark:text-orange-300">
              <div className="rounded-lg bg-orange-100 p-2 transition-transform duration-300 group-hover:scale-110 dark:bg-orange-800">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              Total Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {pendingUsers.length}
              </div>
              <div className="mb-1 text-xs text-orange-600/70 dark:text-orange-400/70">
                awaiting review
              </div>
            </div>
            {pendingUsers.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500"></div>
                <span className="text-xs text-orange-600/80 dark:text-orange-400/80">
                  Requires attention
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Verification Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-yellow-50 to-yellow-100 transition-all duration-300 hover:shadow-lg dark:from-yellow-950 dark:to-yellow-900">
          <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-yellow-200/50 dark:bg-yellow-800/50"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-medium text-yellow-700 dark:text-yellow-300">
              <div className="rounded-lg bg-yellow-100 p-2 transition-transform duration-300 group-hover:scale-110 dark:bg-yellow-800">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {pendingUsers.filter(u => u.userStatus === 'PENDING').length}
              </div>
              <div className="mb-1 text-xs text-yellow-600/70 dark:text-yellow-400/70">
                need verification
              </div>
            </div>
            <div className="mt-3 text-xs text-yellow-600/70 dark:text-yellow-400/70">
              Email verification required
            </div>
          </CardContent>
        </Card>

        {/* Awaiting Approval Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 transition-all duration-300 hover:shadow-lg dark:from-blue-950 dark:to-blue-900">
          <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-blue-200/50 dark:bg-blue-800/50"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-medium text-blue-700 dark:text-blue-300">
              <div className="rounded-lg bg-blue-100 p-2 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-800">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Awaiting Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {pendingUsers.filter(u => u.userStatus === 'VERIFIED').length}
              </div>
              <div className="mb-1 text-xs text-blue-600/70 dark:text-blue-400/70">
                ready for approval
              </div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-blue-200 dark:bg-blue-800">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-400"
                style={{
                  width: `${Math.min((pendingUsers.filter(u => u.userStatus === 'VERIFIED').length / Math.max(pendingUsers.length, 1)) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Rejected Users Card */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-red-100 transition-all duration-300 hover:shadow-lg dark:from-red-950 dark:to-red-900">
          <div className="absolute top-0 right-0 h-20 w-20 translate-x-10 -translate-y-10 rounded-full bg-red-200/50 dark:bg-red-800/50"></div>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-sm font-medium text-red-700 dark:text-red-300">
              <div className="rounded-lg bg-red-100 p-2 transition-transform duration-300 group-hover:scale-110 dark:bg-red-800">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Rejected Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {pendingUsers.filter(u => u.userStatus === 'REJECTED').length}
              </div>
              <div className="mb-1 text-xs text-red-600/70 dark:text-red-400/70">
                applications rejected
              </div>
            </div>
            <div className="mt-3 text-xs text-red-600/70 dark:text-red-400/70">
              Review rejection reasons
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Approval Queue
              </CardTitle>
              <CardDescription>
                Review and approve users waiting for account activation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4">
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Filter Controls */}
          <div className="mb-6 flex items-center gap-4">
            <label className="text-sm font-medium">Filter by status:</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending Verification</SelectItem>
                <SelectItem value="verified">Awaiting Approval</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {pendingUsers.length} users
            </div>
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <User className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="mb-2 text-lg font-medium">No pending users found</p>
              <p className="text-sm">
                {filterStatus === 'all'
                  ? 'All users have been processed or there are no new registrations.'
                  : `No users with status "${filterStatus}" found.`}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email Verified</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => {
                  const StatusIcon =
                    statusConfig[user.userStatus as UserStatus].icon;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            statusConfig[user.userStatus as UserStatus].color
                          }
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig[user.userStatus as UserStatus].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.isEmailVerified ? 'default' : 'secondary'
                          }
                        >
                          {user.isEmailVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(
                            typeof user.createdAt === 'string'
                              ? user.createdAt
                              : user.createdAt?.toString()
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showUserDetails(user)}
                          >
                            Review
                          </Button>
                          {user.userStatus === 'VERIFIED' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApproveUser(user)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Approve'
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectUser(user)}
                                disabled={isProcessing}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Review user information and approve or reject their application
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Name
                  </label>
                  <p className="text-sm">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Role
                  </label>
                  <Badge variant="outline">{selectedUser.role}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <Badge
                    variant="outline"
                    className={
                      statusConfig[selectedUser.userStatus as UserStatus].color
                    }
                  >
                    {statusConfig[selectedUser.userStatus as UserStatus].label}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Registration Date
                  </label>
                  <p className="text-sm">
                    {formatDate(
                      typeof selectedUser.createdAt === 'string'
                        ? selectedUser.createdAt
                        : selectedUser.createdAt?.toString()
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Email Verified
                  </label>
                  <p className="text-sm">
                    {selectedUser.isEmailVerified ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {selectedUser.userStatus === 'VERIFIED' && (
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRejectUser(selectedUser)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Reject Application
                  </Button>
                  <Button
                    onClick={() => handleApproveUser(selectedUser)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Approve User
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
