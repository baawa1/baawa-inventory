'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mobile-optimized components
import { MobileDashboardTable } from '@/components/layouts/MobileDashboardTable';

// Types
import { type User } from './types/user';

// Icons
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconUserCheck,
  IconUserX,
  IconEye,
  IconUser,
} from '@tabler/icons-react';

interface MobileUserTableProps {
  users: User[];
  onEdit: (_user: User) => void;
  onDelete: (_userId: number) => void;
  onApprove?: (_userId: number) => void;
  onReject?: (_userId: number) => void;
  isLoading?: boolean;
  isPendingTab?: boolean;
  totalCount?: number;
  currentCount?: number;
}

const USER_COLUMNS = [
  { key: 'name', label: 'Name', sortable: true, className: 'font-bold' },
  { key: 'email', label: 'Email', sortable: true, className: 'font-bold' },
  { key: 'role', label: 'Role', sortable: true, className: 'font-bold' },
  { key: 'status', label: 'Status', sortable: true, className: 'font-bold' },
  { key: 'active', label: 'Active', sortable: false, className: 'font-bold' },
  { key: 'created', label: 'Created', sortable: true, className: 'font-bold' },
  { key: 'lastLogin', label: 'Last Login', sortable: true, className: 'font-bold' },
];

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

export function MobileUserTable({
  users,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  isLoading,
  isPendingTab = false,
  totalCount,
  currentCount,
}: MobileUserTableProps) {
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>([]);

  // Filter columns based on pending tab
  const availableColumns = React.useMemo(() => {
    if (isPendingTab) {
      return USER_COLUMNS.filter(col => col.key !== 'active' && col.key !== 'lastLogin');
    }
    return USER_COLUMNS;
  }, [isPendingTab]);

  const renderCell = (user: User, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="min-w-0">
            <div className="font-medium truncate text-xs sm:text-sm">
              {user.name ||
                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                'N/A'}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {user.email}
            </div>
          </div>
        );
      case 'email':
        return <span className="text-xs sm:text-sm truncate">{user.email}</span>;
      case 'role':
        return (
          <Badge variant={getRoleColor(user.role)} className="text-xs">
            {user.role}
          </Badge>
        );
      case 'status':
        return (
          <Badge variant={getStatusColor(user.userStatus)} className="text-xs">
            {user.userStatus}
          </Badge>
        );
      case 'active':
        return (
          <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      case 'created':
        return (
          <span className="text-xs sm:text-sm">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        );
      case 'lastLogin':
        return (
          <span className="text-xs sm:text-sm">
            {user.lastLogin
              ? new Date(user.lastLogin).toLocaleDateString()
              : 'Never'}
          </span>
        );
      default:
        return <span className="text-xs sm:text-sm">-</span>;
    }
  };

  const renderActions = (user: User) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <IconDots className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {isPendingTab ? (
          <>
            <DropdownMenuItem
              onClick={() => onEdit(user)}
              className="flex items-center gap-2"
            >
              <IconEye className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {onApprove && (
              <DropdownMenuItem
                onClick={() => onApprove(parseInt(user.id))}
                className="flex items-center gap-2"
              >
                <IconUserCheck className="h-4 w-4" />
                Approve User
              </DropdownMenuItem>
            )}
            {onReject && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onReject(parseInt(user.id))}
                  className="flex items-center gap-2 text-red-600"
                >
                  <IconUserX className="h-4 w-4" />
                  Reject User
                </DropdownMenuItem>
              </>
            )}
          </>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => onEdit(user)}
              className="flex items-center gap-2"
            >
              <IconEdit className="h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(parseInt(user.id))}
              className="flex items-center gap-2 text-red-600"
            >
              <IconTrash className="h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Mobile card title and subtitle
  const mobileCardTitle = (user: User) => (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
        <IconUser className="h-5 w-5 text-gray-600" />
      </div>
      <span className="text-sm font-semibold flex-1 min-w-0 truncate">
        {user.name ||
          `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
          'N/A'}
      </span>
    </div>
  );

  const mobileCardSubtitle = (user: User) => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="truncate">{user.email}</span>
      <span>•</span>
      <Badge variant={getRoleColor(user.role)} className="text-xs">
        {user.role}
      </Badge>
      <span>•</span>
      <Badge variant={getStatusColor(user.userStatus)} className="text-xs">
        {user.userStatus}
      </Badge>
    </div>
  );

  return (
    <MobileDashboardTable
      tableTitle={isPendingTab ? "Pending Users" : "Users"}
      totalCount={totalCount || users.length}
      currentCount={currentCount || users.length}
      columns={availableColumns}
      visibleColumns={visibleColumns}
      onColumnsChange={setVisibleColumns}
      columnCustomizerKey={isPendingTab ? "pending-users-columns" : "users-columns"}
      data={users}
      renderCell={renderCell}
      renderActions={renderActions}
      isLoading={isLoading}
      emptyStateIcon={
        <IconUser className="mx-auto mb-4 h-12 w-12 text-gray-400" />
      }
      emptyStateMessage={isPendingTab ? "No pending users found" : "No users found"}
      mobileCardTitle={mobileCardTitle}
      mobileCardSubtitle={mobileCardSubtitle}
      keyExtractor={user => user.id}
    />
  );
}