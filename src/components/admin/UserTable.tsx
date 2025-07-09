"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { type User } from "./types/user";
import Link from "next/link";

interface UserTableProps {
  users: User[];
  onEditUserAction: (user: User) => void;
  onDeleteUserAction: (userId: number) => void;
  isLoading?: boolean;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "destructive";
    case "MANAGER":
      return "default";
    case "EMPLOYEE":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "default";
    case "PENDING":
      return "secondary";
    case "VERIFIED":
      return "outline";
    case "REJECTED":
      return "destructive";
    case "SUSPENDED":
      return "destructive";
    default:
      return "outline";
  }
};

export function UserTable({
  users,
  onEditUserAction,
  onDeleteUserAction,
  isLoading,
}: UserTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">No users found.</div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Active</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last Login</TableHead>
          <TableHead className="text-right">Actions</TableHead>
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
              <Badge variant={getRoleColor(user.role)}>{user.role}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusColor(user.userStatus)}>
                {user.userStatus}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "Active" : "Inactive"}
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
            <TableCell className="text-right space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditUserAction(user)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteUserAction(user.id)}
              >
                Delete
              </Button>
              <Link href={`/dashboard/audit-logs?userId=${user.id}`}>
                <Button variant="secondary" size="sm" asChild>
                  <span>View Audit Logs</span>
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
