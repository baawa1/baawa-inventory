'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { type User } from './types/user';
import {
  IconEdit,
  IconTrash,
  IconUserCheck,
  IconUserX,
  IconEye,
} from '@tabler/icons-react';

interface UserTableProps {
  users: User[];
  onEdit: (_user: User) => void;
  onDelete: (_userId: number) => void;
  onApprove?: (_userId: number) => void;
  onReject?: (_userId: number) => void;
  isLoading?: boolean;
  isPendingTab?: boolean;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'destructive';
    case 'MANAGER':
      return 'default';
    case 'STAFF':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'default';
    case 'PENDING':
      return 'secondary';
    case 'VERIFIED':
      return 'outline';
    case 'REJECTED':
      return 'destructive';
    case 'SUSPENDED':
      return 'destructive';
    default:
      return 'outline';
  }
};

export function UserTable({
  users,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  isLoading,
  isPendingTab = false,
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
        <div className="text-muted-foreground">
          {isPendingTab ? 'No pending users found.' : 'No users found.'}
        </div>
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
          {!isPendingTab && <TableHead>Active</TableHead>}
          <TableHead>Created</TableHead>
          {!isPendingTab && <TableHead>Last Login</TableHead>}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              {user.name ||
                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                'N/A'}
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
            {!isPendingTab && (
              <TableCell>
                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
            )}
            <TableCell>
              {new Date(user.createdAt).toLocaleDateString()}
            </TableCell>
            {!isPendingTab && (
              <TableCell>
                {user.lastLogin
                  ? new Date(user.lastLogin).toLocaleDateString()
                  : 'Never'}
              </TableCell>
            )}
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                {isPendingTab ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(user)}
                    >
                      <IconEye className="h-4 w-4" />
                    </Button>
                    {onApprove && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onApprove(parseInt(user.id))}
                      >
                        <IconUserCheck className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                    )}
                    {onReject && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onReject(parseInt(user.id))}
                      >
                        <IconUserX className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(user)}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(parseInt(user.id))}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
