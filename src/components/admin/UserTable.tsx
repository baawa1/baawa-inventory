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
import { IconEdit, IconTrash, IconRotateClockwise } from '@tabler/icons-react';

interface UserTableProps {
  users: User[];
  onEdit: (_user: User) => void;
  onDeactivate?: (_userId: number) => void;
  onReactivate?: (_user: User) => void;
  isLoading?: boolean;
  variant?: 'active' | 'inactive';
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
  onDeactivate,
  onReactivate,
  isLoading,
  variant = 'active',
}: UserTableProps) {
  const isInactiveView = variant === 'inactive';

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
          {isInactiveView ? 'No inactive users found.' : 'No active users found.'}
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
        <TableHead>Active</TableHead>
        <TableHead>Created</TableHead>
        <TableHead>Last Login</TableHead>
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
            <TableCell>
              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(user.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              {user.lastLogin
                ? new Date(user.lastLogin).toLocaleDateString()
                : 'Never'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(user)}
                >
                  <IconEdit className="h-4 w-4" />
                </Button>
                {isInactiveView ? (
                  onReactivate && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onReactivate(user)}
                    >
                      <IconRotateClockwise className="mr-1 h-4 w-4" />
                      Reactivate
                    </Button>
                  )
                ) : (
                  onDeactivate && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeactivate(parseInt(user.id))}
                    >
                      <IconTrash className="mr-1 h-4 w-4" />
                      Deactivate
                    </Button>
                  )
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
