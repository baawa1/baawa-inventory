"use client";

import { useState, useEffect, useCallback } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface PendingUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userStatus: "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED" | "SUSPENDED";
  emailVerified: boolean;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
}

const statusConfig = {
  PENDING: {
    label: "Pending Verification",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  VERIFIED: {
    label: "Awaiting Approval",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  SUSPENDED: {
    label: "Suspended",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertCircle,
  },
};

export function PendingUsersManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Check if user is admin
  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "ADMIN") {
      router.push("/unauthorized");
      return;
    }
  }, [session, status, router]);

  // Fetch pending users
  const fetchPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all users first, then filter based on selected status
      const url =
        filterStatus === "all"
          ? "/api/users"
          : `/api/users?status=${filterStatus}`;

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();

      // Filter users to show non-approved users for management
      const filteredUsers =
        filterStatus === "all"
          ? data.filter((user: PendingUser) => user.userStatus !== "APPROVED")
          : data;

      setPendingUsers(filteredUsers || []);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch users"
      );
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    if (session?.user.role === "ADMIN") {
      fetchPendingUsers();
    }
  }, [session, fetchPendingUsers]);

  // Filter users based on selected status
  const filteredUsers = pendingUsers;

  // Handle user approval
  const handleApproveUser = async (user: PendingUser) => {
    setProcessingUserId(user.id);
    try {
      const response = await fetch(`/api/admin/approve-user`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          action: "approve",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve user");
      }

      // Refresh the list
      await fetchPendingUsers();
      setIsDetailsDialogOpen(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to approve user"
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  // Handle user rejection
  const handleRejectUser = async (user: PendingUser, reason?: string) => {
    setProcessingUserId(user.id);
    try {
      const response = await fetch(`/api/admin/approve-user`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          action: "reject",
          rejectionReason: reason || "Application rejected by administrator",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject user");
      }

      // Refresh the list
      await fetchPendingUsers();
      setIsDetailsDialogOpen(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to reject user"
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show user details in dialog
  const showUserDetails = (user: PendingUser) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  if (status === "loading" || loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading pending users...
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
                <User className="h-5 w-5" />
                Pending User Approvals
              </CardTitle>
              <CardDescription>
                Review and approve users waiting for account activation
              </CardDescription>
            </div>
            <Button onClick={fetchPendingUsers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Filter Controls */}
          <div className="flex items-center gap-4 mb-6">
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
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No pending users found</p>
              <p className="text-sm">
                {filterStatus === "all"
                  ? "All users have been processed or there are no new registrations."
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
                {filteredUsers.map((user) => {
                  const StatusIcon = statusConfig[user.userStatus].icon;
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
                          className={statusConfig[user.userStatus].color}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[user.userStatus].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.emailVerified ? "default" : "secondary"}
                        >
                          {user.emailVerified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(user.createdAt)}
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
                          {user.userStatus === "VERIFIED" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApproveUser(user)}
                                disabled={processingUserId === user.id}
                              >
                                {processingUserId === user.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Approve"
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectUser(user)}
                                disabled={processingUserId === user.id}
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
                    className={statusConfig[selectedUser.userStatus].color}
                  >
                    {statusConfig[selectedUser.userStatus].label}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Registration Date
                  </label>
                  <p className="text-sm">
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Email Verified
                  </label>
                  <p className="text-sm">
                    {selectedUser.emailVerified ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {selectedUser.userStatus === "VERIFIED" && (
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
                    disabled={processingUserId === selectedUser.id}
                  >
                    {processingUserId === selectedUser.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject Application
                  </Button>
                  <Button
                    onClick={() => handleApproveUser(selectedUser)}
                    disabled={processingUserId === selectedUser.id}
                  >
                    {processingUserId === selectedUser.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
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
